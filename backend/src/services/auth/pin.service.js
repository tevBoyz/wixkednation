const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const { normalizePhone, isValidEthiopianPhone } = require("../../utils/phone");
const {
  buildAuthTokenPayload,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken
} = require("./token.service");
const { getJwtExpiryDate } = require("./token.helpers");

const PIN_SETUP_PURPOSE = "pin-setup";
const PIN_SETUP_EXPIRES_IN = "15m";
const BCRYPT_ROUNDS = 10;
const MAX_PIN_FAILURES = 5;
const PIN_LOCK_MINUTES = 15;

function createPinError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureJwtConfig() {
  if (!env.jwt.accessSecret) {
    throw new Error("Missing JWT access secret configuration.");
  }
}

function mapSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    authProvider: user.authProvider,
    role: user.role,
    hasPin: Boolean(user.pinHash)
  };
}

function validatePin(pin) {
  if (typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
    throw createPinError("PIN must be 4 to 6 digits.", 400);
  }

  return pin;
}

async function hashPin(pin) {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

async function verifyPinHash(pin, pinHash) {
  if (!pinHash) {
    return false;
  }

  return bcrypt.compare(pin, pinHash);
}

function signPinSetupToken(user) {
  ensureJwtConfig();

  return jwt.sign(
    {
      sub: user.id,
      purpose: PIN_SETUP_PURPOSE,
      role: user.role
    },
    env.jwt.accessSecret,
    {
      expiresIn: PIN_SETUP_EXPIRES_IN
    }
  );
}

function verifyPinSetupToken(token) {
  ensureJwtConfig();

  const decoded = jwt.verify(token, env.jwt.accessSecret);

  if (!decoded || decoded.purpose !== PIN_SETUP_PURPOSE || !decoded.sub) {
    throw createPinError("Invalid or expired PIN setup token.", 401);
  }

  return decoded;
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

function assertNotLocked(user) {
  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    const waitSeconds = Math.ceil(
      (user.pinLockedUntil.getTime() - Date.now()) / 1000
    );
    throw createPinError(
      `PIN locked. Try again in ${waitSeconds} seconds.`,
      429
    );
  }
}

async function recordPinFailure(user) {
  const failures = (user.pinFailedAttempts || 0) + 1;
  const data = {
    pinFailedAttempts: failures
  };

  if (failures >= MAX_PIN_FAILURES) {
    data.pinLockedUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
    data.pinFailedAttempts = 0;
  }

  await prisma.user.update({
    where: { id: user.id },
    data
  });

  if (data.pinLockedUntil) {
    throw createPinError(
      `Too many invalid PIN attempts. Locked for ${PIN_LOCK_MINUTES} minutes.`,
      429
    );
  }

  throw createPinError("Invalid PIN.", 401);
}

async function clearPinFailures(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      pinFailedAttempts: 0,
      pinLockedUntil: null
    }
  });
}

async function setUserPin(userId, { pin, confirmPin }) {
  const normalizedPin = validatePin(pin);

  if (confirmPin !== normalizedPin) {
    throw createPinError("PIN confirmation does not match.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.deletedAt) {
    throw createPinError("User account not found or disabled.", 403);
  }

  const pinHash = await hashPin(normalizedPin);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      pinHash,
      pinSetAt: new Date(),
      pinFailedAttempts: 0,
      pinLockedUntil: null
    }
  });

  const tokens = await issueAuthTokens(updated);

  return {
    user: mapSafeUser(updated),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
}

async function findUserForPinLogin({ phone, email }) {
  const hasPhone = typeof phone === "string" && phone.trim();
  const hasEmail = typeof email === "string" && email.trim();

  if (hasPhone && hasEmail) {
    throw createPinError("Provide phone or email, not both.", 400);
  }

  if (!hasPhone && !hasEmail) {
    throw createPinError("Provide phone or email.", 400);
  }

  if (hasPhone) {
    const normalized = normalizePhone(phone);

    if (!isValidEthiopianPhone(normalized)) {
      throw createPinError(
        "Invalid phone number. Use Ethiopian format like +251911000000.",
        400
      );
    }

    return prisma.user.findFirst({
      where: {
        phone: normalized,
        deletedAt: null
      }
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  return prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive"
      },
      deletedAt: null
    }
  });
}

async function loginWithPin({ phone, email, pin }) {
  const normalizedPin = validatePin(pin);
  const user = await findUserForPinLogin({ phone, email });

  if (!user) {
    throw createPinError("Invalid credentials.", 401);
  }

  if (!user.pinHash) {
    throw createPinError(
      "PIN is not set for this account. Complete OTP or Google verification first.",
      400
    );
  }

  assertNotLocked(user);

  const ok = await verifyPinHash(normalizedPin, user.pinHash);

  if (!ok) {
    await recordPinFailure(user);
  }

  await clearPinFailures(user.id);

  const tokens = await issueAuthTokens(user);

  return {
    user: mapSafeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
}

async function changePin(userId, { currentPin, newPin, confirmPin }) {
  const current = validatePin(currentPin);
  const next = validatePin(newPin);

  if (confirmPin !== next) {
    throw createPinError("PIN confirmation does not match.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.deletedAt) {
    throw createPinError("User account not found or disabled.", 403);
  }

  if (!user.pinHash) {
    throw createPinError("No PIN is set. Use PIN setup instead.", 400);
  }

  assertNotLocked(user);

  const ok = await verifyPinHash(current, user.pinHash);

  if (!ok) {
    await recordPinFailure(user);
  }

  const pinHash = await hashPin(next);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      pinHash,
      pinSetAt: new Date(),
      pinFailedAttempts: 0,
      pinLockedUntil: null
    }
  });

  return {
    user: mapSafeUser(updated)
  };
}

function buildPinSetupResponse(user) {
  return {
    requiresPinSetup: true,
    setupToken: signPinSetupToken(user),
    user: mapSafeUser(user)
  };
}

module.exports = {
  PIN_SETUP_PURPOSE,
  buildPinSetupResponse,
  changePin,
  hashPin,
  issueAuthTokens,
  loginWithPin,
  mapSafeUser,
  setUserPin,
  signPinSetupToken,
  validatePin,
  verifyPinSetupToken
};
