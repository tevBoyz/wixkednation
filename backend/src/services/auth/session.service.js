const env = require("../../config/env");
const prisma = require("../../config/prisma");
const {
  buildAuthTokenPayload,
  findStoredRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require("./token.service");
const { getJwtExpiryDate } = require("./token.helpers");

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function refreshAuthSession(refreshToken) {
  if (!refreshToken || typeof refreshToken !== "string") {
    throw createAuthError("Refresh token is required.", 400);
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw createAuthError("Invalid or expired refresh token.", 401);
  }

  if (!decoded?.sub) {
    throw createAuthError("Invalid refresh token payload.", 401);
  }

  const storedToken = await findStoredRefreshToken(refreshToken);

  if (!storedToken) {
    throw createAuthError("Refresh token not found or already revoked.", 401);
  }

  if (storedToken.revokedAt) {
    throw createAuthError("Refresh token has been revoked.", 401);
  }

  if (storedToken.expiresAt <= new Date()) {
    throw createAuthError("Refresh token expired.", 401);
  }

  if (storedToken.userId !== decoded.sub) {
    throw createAuthError("Refresh token does not match user.", 401);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.sub
    }
  });

  if (!user || user.deletedAt) {
    throw createAuthError("User account not found or disabled.", 403);
  }

  const payload = buildAuthTokenPayload(user);
  const nextAccessToken = signAccessToken(payload);
  const nextRefreshToken = signRefreshToken(payload);
  const nextExpiresAt = getJwtExpiryDate(env.jwt.refreshExpiresIn);

  const rotated = await rotateRefreshToken({
    userId: user.id,
    currentRefreshToken: refreshToken,
    nextRefreshToken,
    nextExpiresAt
  });

  if (!rotated) {
    throw createAuthError("Unable to rotate refresh token.", 401);
  }

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      authProvider: user.authProvider,
      role: user.role
    }
  };
}

async function logoutAuthSession(refreshToken) {
  if (!refreshToken || typeof refreshToken !== "string") {
    throw createAuthError("Refresh token is required.", 400);
  }

  const revoked = await revokeRefreshToken(refreshToken);

  if (!revoked) {
    throw createAuthError("Refresh token not found or already revoked.", 400);
  }

  return {
    revoked: true
  };
}

module.exports = {
  logoutAuthSession,
  refreshAuthSession
};
