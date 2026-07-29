const crypto = require("crypto");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const { resolveProvider, sendSms } = require("../sms/sms.service");
const {
  buildPinSetupResponse,
  issueAuthTokens,
  mapSafeUser
} = require("./pin.service");

function generateOtpCode(length = env.otp.length) {
  const digits = "0123456789";
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += digits[crypto.randomInt(0, digits.length)];
  }

  return code;
}

function hashOtpCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function shouldLogOtpToConsole() {
  const provider = resolveProvider();

  return env.nodeEnv === "development" || provider.name === "mock";
}

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getLatestActiveChallenge(phone) {
  return prisma.otpChallenge.findFirst({
    where: {
      phone,
      consumedAt: null
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

async function assertOtpSendAllowed(phone, purpose) {
  const normalizedPurpose =
    purpose === "forgot_pin" ? "forgot_pin" : "register";

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        { supabaseUserId: `local-phone:${phone}` },
        { supabaseUserId: `local-guest:${phone}` }
      ]
    }
  });

  if (normalizedPurpose === "forgot_pin") {
    if (!existingUser || existingUser.deletedAt) {
      throw createAuthError("No account found for this phone number.", 404);
    }

    if (!existingUser.pinHash) {
      throw createAuthError(
        "No PIN is set for this account. Use OTP registration instead.",
        400
      );
    }

    return { purpose: normalizedPurpose, existingUser };
  }

  if (existingUser && !existingUser.deletedAt && existingUser.pinHash) {
    throw createAuthError(
      "Account already has a PIN. Use PIN login or Forgot PIN.",
      409
    );
  }

  return { purpose: normalizedPurpose, existingUser };
}

async function createAndSendPhoneOtp(phone, { purpose } = {}) {
  await assertOtpSendAllowed(phone, purpose);

  const latestChallenge = await getLatestActiveChallenge(phone);
  const now = new Date();

  if (
    latestChallenge &&
    latestChallenge.resendCooldownEnds &&
    latestChallenge.resendCooldownEnds > now
  ) {
    const waitSeconds = Math.ceil(
      (latestChallenge.resendCooldownEnds.getTime() - now.getTime()) / 1000
    );

    const error = new Error(
      `Please wait ${waitSeconds} seconds before requesting another OTP.`
    );
    error.statusCode = 429;
    throw error;
  }

  const otpCode = generateOtpCode();
  const codeHash = hashOtpCode(otpCode);
  const expiresAt = new Date(
    now.getTime() + env.otp.expiresMinutes * 60 * 1000
  );
  const resendCooldownEnds = new Date(
    now.getTime() + env.otp.resendCooldownSeconds * 1000
  );

  const challenge = await prisma.otpChallenge.create({
    data: {
      phone,
      codeHash,
      expiresAt,
      attempts: 0,
      maxAttempts: env.otp.maxAttempts,
      resendCooldownEnds
    }
  });

  const message = `Your verification code is ${otpCode}. It expires in ${env.otp.expiresMinutes} minutes.`;

  const smsResult = await sendSms({
    phone,
    message,
    purpose: "otp",
    metadata: {
      challengeId: challenge.id,
      otpPurpose: purpose === "forgot_pin" ? "forgot_pin" : "register"
    }
  });

  if (shouldLogOtpToConsole()) {
    console.log(`[otp-dev] phone=${phone} otp=${otpCode}`);
  }

  if (!smsResult.success) {
    const error = new Error(smsResult.error || "Failed to send OTP SMS.");
    error.statusCode = 502;
    error.details = {
      challengeId: challenge.id,
      smsLogId: smsResult.smsLogId || null
    };
    throw error;
  }

  return {
    challengeId: challenge.id,
    expiresAt: challenge.expiresAt,
    resendCooldownEnds: challenge.resendCooldownEnds,
    smsLogId: smsResult.smsLogId || null,
    provider: smsResult.provider
  };
}

async function findOrCreatePhoneUser(phone) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        { supabaseUserId: `local-phone:${phone}` },
        { supabaseUserId: `local-guest:${phone}` }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.deletedAt) {
      throw createAuthError("User account is disabled.", 403);
    }

    return prisma.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        phone,
        authProvider: "phone",
        supabaseUserId:
          existingUser.supabaseUserId?.startsWith("local-guest:")
            ? `local-phone:${phone}`
            : existingUser.supabaseUserId,
        deletedAt: null
      }
    });
  }

  return prisma.user.create({
    data: {
      supabaseUserId: `local-phone:${phone}`,
      phone,
      authProvider: "phone",
      role: "customer"
    }
  });
}

async function upsertPhoneAuthAccount(user, phone) {
  const existingAccount = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "phone",
        providerAccountId: phone
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
        phone,
        isVerified: true,
        deletedAt: null
      }
    });
  }

  return prisma.authAccount.create({
    data: {
      userId: user.id,
      provider: "phone",
      providerAccountId: phone,
      phone,
      isVerified: true
    }
  });
}

async function verifyPhoneOtp({ phone, otp, purpose }) {
  if (!otp || typeof otp !== "string") {
    throw createAuthError("OTP is required.", 400);
  }

  const normalizedOtp = otp.trim();

  if (!/^\d+$/.test(normalizedOtp) || normalizedOtp.length !== env.otp.length) {
    throw createAuthError(`OTP must be a ${env.otp.length}-digit code.`, 400);
  }

  const challenge = await getLatestActiveChallenge(phone);

  if (!challenge) {
    throw createAuthError("No active OTP challenge found. Request a new code.", 400);
  }

  const now = new Date();

  if (challenge.expiresAt <= now) {
    throw createAuthError("OTP expired. Request a new code.", 400);
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw createAuthError("Too many invalid OTP attempts. Request a new code.", 429);
  }

  const incomingHash = hashOtpCode(normalizedOtp);

  if (incomingHash !== challenge.codeHash) {
    await prisma.otpChallenge.update({
      where: {
        id: challenge.id
      },
      data: {
        attempts: {
          increment: 1
        }
      }
    });

    throw createAuthError("Invalid OTP.", 400);
  }

  const user = await findOrCreatePhoneUser(phone);
  await upsertPhoneAuthAccount(user, phone);

  await prisma.otpChallenge.update({
    where: {
      id: challenge.id
    },
    data: {
      consumedAt: now,
      userId: user.id
    }
  });

  const isForgot = purpose === "forgot_pin";
  const needsPinSetup = isForgot || !user.pinHash;

  if (needsPinSetup) {
    return buildPinSetupResponse(user);
  }

  const tokens = await issueAuthTokens(user);

  return {
    requiresPinSetup: false,
    user: mapSafeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
}

module.exports = {
  createAndSendPhoneOtp,
  generateOtpCode,
  hashOtpCode,
  verifyPhoneOtp
};
