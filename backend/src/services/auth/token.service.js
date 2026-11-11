const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const env = require("../../config/env");
const prisma = require("../../config/prisma");

function ensureJwtConfig() {
  if (!env.jwt.accessSecret) {
    throw new Error("Missing JWT access secret configuration.");
  }

  if (!env.jwt.refreshSecret) {
    throw new Error("Missing JWT refresh secret configuration.");
  }
}

function signAccessToken(payload) {
  ensureJwtConfig();

  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn
  });
}

function signRefreshToken(payload) {
  ensureJwtConfig();

  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn
  });
}

function verifyAccessToken(token) {
  ensureJwtConfig();

  return jwt.verify(token, env.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  ensureJwtConfig();

  return jwt.verify(token, env.jwt.refreshSecret);
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildAuthTokenPayload(user) {
  return {
    sub: user.id,
    role: user.role,
    phone: user.phone || null,
    email: user.email || null
  };
}

async function storeRefreshToken({ userId, refreshToken, expiresAt }) {
  const tokenHash = hashRefreshToken(refreshToken);

  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });
}

async function findStoredRefreshToken(refreshToken) {
  return prisma.refreshToken.findUnique({
    where: {
      tokenHash: hashRefreshToken(refreshToken)
    }
  });
}

async function revokeRefreshToken(refreshToken) {
  const existingToken = await findStoredRefreshToken(refreshToken);

  if (!existingToken) {
    return null;
  }

  return prisma.refreshToken.update({
    where: {
      id: existingToken.id
    },
    data: {
      revokedAt: new Date()
    }
  });
}

async function revokeAllUserRefreshTokens(userId) {
  return prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

async function rotateRefreshToken({ userId, currentRefreshToken, nextRefreshToken, nextExpiresAt }) {
  const existingToken = await findStoredRefreshToken(currentRefreshToken);

  if (!existingToken || existingToken.revokedAt) {
    return null;
  }

  const revokedToken = await prisma.refreshToken.update({
    where: {
      id: existingToken.id
    },
    data: {
      revokedAt: new Date()
    }
  });

  const storedToken = await storeRefreshToken({
    userId,
    refreshToken: nextRefreshToken,
    expiresAt: nextExpiresAt
  });

  return {
    revokedToken,
    storedToken
  };
}

module.exports = {
  buildAuthTokenPayload,
  findStoredRefreshToken,
  hashRefreshToken,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
