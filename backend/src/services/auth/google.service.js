const crypto = require("crypto");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const {
  buildAuthTokenPayload,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken
} = require("./token.service");
const { getJwtExpiryDate } = require("./token.helpers");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const pendingOAuthStates = new Map();
const pendingAuthHandoffCodes = new Map();

const AUTH_HANDOFF_TTL_MS = 60 * 1000;

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureGoogleConfig() {
  if (!env.google.clientId || !env.google.clientSecret || !env.google.callbackUrl) {
    throw createAuthError("Google OAuth is not configured.", 500);
  }
}

function cleanupExpiredStates() {
  const now = Date.now();

  for (const [state, value] of pendingOAuthStates.entries()) {
    if (value.expiresAt <= now) {
      pendingOAuthStates.delete(state);
    }
  }
}

function createOAuthState() {
  cleanupExpiredStates();

  const state = crypto.randomBytes(24).toString("hex");

  pendingOAuthStates.set(state, {
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  return state;
}

function consumeOAuthState(state) {
  cleanupExpiredStates();

  if (!state || !pendingOAuthStates.has(state)) {
    return false;
  }

  pendingOAuthStates.delete(state);
  return true;
}

function cleanupExpiredHandoffCodes() {
  const now = Date.now();

  for (const [code, value] of pendingAuthHandoffCodes.entries()) {
    if (value.expiresAt <= now) {
      pendingAuthHandoffCodes.delete(code);
    }
  }
}

function createAuthHandoffCode({ accessToken, refreshToken, user }) {
  cleanupExpiredHandoffCodes();

  const code = crypto.randomBytes(32).toString("hex");

  pendingAuthHandoffCodes.set(code, {
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
    user,
    userId: user?.id || null,
    expiresAt: Date.now() + AUTH_HANDOFF_TTL_MS
  });

  return code;
}

function consumeAuthHandoffCode(code) {
  cleanupExpiredHandoffCodes();

  if (!code || !pendingAuthHandoffCodes.has(code)) {
    throw createAuthError("Invalid or expired auth handoff code.", 400);
  }

  const payload = pendingAuthHandoffCodes.get(code);
  pendingAuthHandoffCodes.delete(code);

  if (payload.expiresAt <= Date.now()) {
    throw createAuthError("Invalid or expired auth handoff code.", 400);
  }

  return payload;
}

async function exchangeAuthHandoffCode(code) {
  const { buildPinSetupResponse, issueAuthTokens, mapSafeUser } = require("./pin.service");

  const payload = consumeAuthHandoffCode(code);
  const userId = payload.userId || payload.user?.id;

  if (!userId) {
    throw createAuthError("Invalid or expired auth handoff code.", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user || user.deletedAt) {
    throw createAuthError("User account not found or disabled.", 403);
  }

  if (!user.pinHash) {
    return buildPinSetupResponse(user);
  }

  if (payload.accessToken && payload.refreshToken) {
    return {
      requiresPinSetup: false,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: mapSafeUser(user)
    };
  }

  const tokens = await issueAuthTokens(user);

  return {
    requiresPinSetup: false,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: mapSafeUser(user)
  };
}

function buildGoogleAuthUrl(state) {
  ensureGoogleConfig();

  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  ensureGoogleConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: env.google.callbackUrl,
      grant_type: "authorization_code"
    })
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok || !raw?.access_token) {
    throw createAuthError(
      raw?.error_description || raw?.error || "Failed to exchange Google auth code.",
      400
    );
  }

  return raw;
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const profile = await response.json().catch(() => null);

  if (!response.ok || !profile?.sub) {
    throw createAuthError("Failed to fetch Google user profile.", 400);
  }

  return profile;
}

async function issueAuthTokens(user) {
  const payload = buildAuthTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshExpiresAt = getJwtExpiryDate(env.jwt.refreshExpiresIn);

  await storeRefreshToken({
    userId: user.id,
    refreshToken,
    expiresAt: refreshExpiresAt
  });

  return {
    accessToken,
    refreshToken
  };
}

async function upsertGoogleAuthAccount(user, profile) {
  const existingAccount = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: profile.sub
      }
    }
  });

  if (existingAccount) {
    return prisma.authAccount.update({
      where: {
        id: existingAccount.id
      },
      data: {
        userId: user.id,
        email: profile.email || null,
        isVerified: Boolean(profile.email_verified),
        deletedAt: null
      }
    });
  }

  return prisma.authAccount.create({
    data: {
      userId: user.id,
      provider: "google",
      providerAccountId: profile.sub,
      email: profile.email || null,
      isVerified: Boolean(profile.email_verified)
    }
  });
}

async function findOrCreateGoogleUser(profile) {
  const googleAuthId = `google:${profile.sub}`;

  const existingGoogleAccount = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: profile.sub
      }
    },
    include: {
      user: true
    }
  });

  if (existingGoogleAccount?.user) {
    if (existingGoogleAccount.user.deletedAt) {
      throw createAuthError("User account is disabled.", 403);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: existingGoogleAccount.user.id
      },
      data: {
        name: profile.name || existingGoogleAccount.user.name,
        email: profile.email || existingGoogleAccount.user.email,
        authProvider: "google",
        deletedAt: null
      }
    });

    await upsertGoogleAuthAccount(updatedUser, profile);
    return updatedUser;
  }

  let existingUser = null;

  if (profile.email) {
    existingUser = await prisma.user.findFirst({
      where: {
        email: profile.email
      }
    });
  }

  if (!existingUser) {
    existingUser = await prisma.user.findFirst({
      where: {
        supabaseUserId: googleAuthId
      }
    });
  }

  if (existingUser) {
    if (existingUser.deletedAt) {
      throw createAuthError("User account is disabled.", 403);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        name: profile.name || existingUser.name,
        email: profile.email || existingUser.email,
        authProvider: existingUser.authProvider || "google",
        deletedAt: null
      }
    });

    await upsertGoogleAuthAccount(updatedUser, profile);
    return updatedUser;
  }

  const createdUser = await prisma.user.create({
    data: {
      // Temporary compatibility field until supabaseUserId is removed from the schema.
      supabaseUserId: googleAuthId,
      name: profile.name || null,
      email: profile.email || null,
      authProvider: "google",
      role: "customer"
    }
  });

  await upsertGoogleAuthAccount(createdUser, profile);
  return createdUser;
}

function getGoogleStartUrl() {
  const state = createOAuthState();
  return buildGoogleAuthUrl(state);
}

function buildFrontendHandoffUrl({ handoffCode, error }) {
  const redirectUrl = new URL(`${env.frontendUrl.replace(/\/$/, "")}/auth/google/callback`);

  if (error) {
    redirectUrl.searchParams.set("error", error);
    return redirectUrl.toString();
  }

  redirectUrl.searchParams.set("code", handoffCode);
  return redirectUrl.toString();
}

async function handleGoogleCallback({ code, state }) {
  if (!consumeOAuthState(state)) {
    throw createAuthError("Invalid or expired Google OAuth state.", 400);
  }

  if (!code) {
    throw createAuthError("Google authorization code is missing.", 400);
  }

  const tokenResponse = await exchangeCodeForTokens(code);
  const profile = await fetchGoogleProfile(tokenResponse.access_token);
  const user = await findOrCreateGoogleUser(profile);

  const safeUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    authProvider: user.authProvider,
    role: user.role
  };

  // Tokens issued at exchange time after PIN status is known.
  const handoffCode = createAuthHandoffCode({
    user: safeUser
  });

  return {
    user: safeUser,
    handoffCode
  };
}

async function createHandoffForUser(user) {
  const tokens = await issueAuthTokens(user);

  const safeUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    authProvider: user.authProvider,
    role: user.role
  };

  return {
    code: createAuthHandoffCode({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: safeUser
    })
  };
}

module.exports = {
  AUTH_HANDOFF_TTL_MS,
  buildFrontendHandoffUrl,
  createAuthHandoffCode,
  createHandoffForUser,
  exchangeAuthHandoffCode,
  getGoogleStartUrl,
  handleGoogleCallback
};
