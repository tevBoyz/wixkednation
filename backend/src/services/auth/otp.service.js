const crypto = require("crypto");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const { getActiveSmsProviderName, sendSms } = require("../sms/sms.service");
const {
  isEmailConfigured,
  sendOtpEmail
} = require("../email/email.service");
const {
  buildPinSetupResponse,
  issueAuthTokens,
  mapSafeUser
} = require("./pin.service");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function normalizeEmail(email) {
  if (!email || typeof email !== "string") {
    return null;
  }

  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

function isValidEmail(email) {
  return Boolean(email && EMAIL_REGEX.test(email));
}

async function shouldLogOtpToConsole() {
  if (env.nodeEnv === "development") {
    return true;
  }

  const smsProvider = await getActiveSmsProviderName();
  if (smsProvider === "mock") {
    return true;
  }

  return (env.email.provider || "mock").toLowerCase() === "mock";
}

async function isSmsOtpEnabled() {
  const provider = await getActiveSmsProviderName();
  if (provider !== "twilio") {
    return false;
  }

  return Boolean(
    env.sms.twilioAccountSid &&
      env.sms.twilioAuthToken &&
      env.sms.twilioFromNumber
  );
}

function isEmailOtpEnabled() {
  return isEmailConfigured();
}

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getLatestActiveChallenge({ phone, email, channel }) {
  const where = {
    consumedAt: null,
    channel
  };

  if (channel === "email") {
    where.email = email;
  } else {
    where.phone = phone;
  }

  return prisma.otpChallenge.findFirst({
    where,
    orderBy: {
      createdAt: "desc"
    }
  });
}

async function assertCooldown(latestChallenge) {
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
}

async function findUserByPhone(phone) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        { supabaseUserId: `local-phone:${phone}` },
        { supabaseUserId: `local-guest:${phone}` }
      ]
    }
  });
}

async function findUserByEmail(email) {
  return prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive"
      }
    }
  });
}

async function assertEmailOtpSendAllowed(email, purpose) {
  const normalizedPurpose =
    purpose === "forgot_pin" ? "forgot_pin" : "register";

  const existingUser = await findUserByEmail(email);

  if (normalizedPurpose === "forgot_pin") {
    if (!existingUser || existingUser.deletedAt) {
      throw createAuthError("No account found for this email.", 404);
    }

    if (!existingUser.pinHash) {
      throw createAuthError(
        "No PIN is set for this account. Register or continue with Google instead.",
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

async function assertPhoneOtpSendAllowed(phone, purpose, email) {
  const normalizedPurpose =
    purpose === "forgot_pin" ? "forgot_pin" : "register";

  if (!(await isSmsOtpEnabled())) {
    throw createAuthError(
      "Phone OTP is not available. Use email verification or Google instead.",
      400
    );
  }

  const existingUser = await findUserByPhone(phone);

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

    return { purpose: normalizedPurpose, existingUser, email: null };
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw createAuthError(
      "Email is required when registering with phone OTP.",
      400
    );
  }

  const emailUser = await findUserByEmail(normalizedEmail);

  if (emailUser && !emailUser.deletedAt && emailUser.pinHash) {
    throw createAuthError(
      "Email is already registered. Use PIN login or Forgot PIN.",
      409
    );
  }

  if (existingUser && !existingUser.deletedAt && existingUser.pinHash) {
    throw createAuthError(
      "Account already has a PIN. Use PIN login or Forgot PIN.",
      409
    );
  }

  return {
    purpose: normalizedPurpose,
    existingUser,
    email: normalizedEmail
  };
}

async function createAndSendEmailOtp(emailInput, { purpose } = {}) {
  if (!isEmailOtpEnabled()) {
    throw createAuthError("Email OTP is not configured.", 503);
  }

  const email = normalizeEmail(emailInput);

  if (!email || !isValidEmail(email)) {
    throw createAuthError("A valid email address is required.", 400);
  }

  await assertEmailOtpSendAllowed(email, purpose);

  const latestChallenge = await getLatestActiveChallenge({
    email,
    channel: "email"
  });
  await assertCooldown(latestChallenge);

  const now = new Date();
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
      email,
      phone: null,
      channel: "email",
      codeHash,
      expiresAt,
      attempts: 0,
      maxAttempts: env.otp.maxAttempts,
      resendCooldownEnds
    }
  });

  const emailResult = await sendOtpEmail({
    to: email,
    otpCode,
    purpose: purpose === "forgot_pin" ? "forgot_pin" : "register",
    expiresMinutes: env.otp.expiresMinutes,
    metadata: {
      challengeId: challenge.id
    }
  });

  if (await shouldLogOtpToConsole()) {
    console.log(`[otp-dev] email=${email} otp=${otpCode}`);
  }

  if (!emailResult.success) {
    const error = new Error(emailResult.error || "Failed to send OTP email.");
    error.statusCode = 502;
    error.details = {
      challengeId: challenge.id,
      emailLogId: emailResult.emailLogId || null
    };
    throw error;
  }

  return {
    challengeId: challenge.id,
    expiresAt: challenge.expiresAt,
    resendCooldownEnds: challenge.resendCooldownEnds,
    channel: "email",
    emailLogId: emailResult.emailLogId || null,
    provider: emailResult.provider
  };
}

async function createAndSendPhoneOtp(phone, { purpose, email } = {}) {
  const allowed = await assertPhoneOtpSendAllowed(phone, purpose, email);

  const latestChallenge = await getLatestActiveChallenge({
    phone,
    channel: "sms"
  });
  await assertCooldown(latestChallenge);

  const now = new Date();
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
      email: allowed.email || null,
      channel: "sms",
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
      otpPurpose: purpose === "forgot_pin" ? "forgot_pin" : "register",
      email: allowed.email || null
    }
  });

  if (await shouldLogOtpToConsole()) {
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
    channel: "sms",
    smsLogId: smsResult.smsLogId || null,
    provider: smsResult.provider
  };
}

async function findOrCreatePhoneUser(phone, email) {
  const existingUser = await findUserByPhone(phone);

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
        ...(email ? { email } : {}),
        authProvider: existingUser.authProvider || "phone",
        supabaseUserId: existingUser.supabaseUserId?.startsWith("local-guest:")
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
      email: email || null,
      authProvider: "phone",
      role: "customer"
    }
  });
}

async function findOrCreateEmailUser(email) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    if (existingUser.deletedAt) {
      throw createAuthError("User account is disabled.", 403);
    }

    return prisma.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        email,
        authProvider:
          existingUser.authProvider === "guest" ? "email" : existingUser.authProvider || "email",
        deletedAt: null
      }
    });
  }

  return prisma.user.create({
    data: {
      supabaseUserId: `local-email:${email}`,
      email,
      authProvider: "email",
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

async function upsertEmailAuthAccount(user, email) {
  const existingAccount = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "email",
        providerAccountId: email
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
        email,
        isVerified: true,
        deletedAt: null
      }
    });
  }

  return prisma.authAccount.create({
    data: {
      userId: user.id,
      provider: "email",
      providerAccountId: email,
      email,
      isVerified: true
    }
  });
}

async function consumeChallenge(challenge, user) {
  await prisma.otpChallenge.update({
    where: {
      id: challenge.id
    },
    data: {
      consumedAt: new Date(),
      userId: user.id
    }
  });
}

async function validateOtpAgainstChallenge(challenge, otp) {
  if (!otp || typeof otp !== "string") {
    throw createAuthError("OTP is required.", 400);
  }

  const normalizedOtp = otp.trim();

  if (!/^\d+$/.test(normalizedOtp) || normalizedOtp.length !== env.otp.length) {
    throw createAuthError(`OTP must be a ${env.otp.length}-digit code.`, 400);
  }

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

  return normalizedOtp;
}

async function buildVerifyResult(user, purpose) {
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

async function verifyEmailOtp({ email: emailInput, otp, purpose }) {
  const email = normalizeEmail(emailInput);

  if (!email || !isValidEmail(email)) {
    throw createAuthError("A valid email address is required.", 400);
  }

  const challenge = await getLatestActiveChallenge({
    email,
    channel: "email"
  });

  await validateOtpAgainstChallenge(challenge, otp);

  const user = await findOrCreateEmailUser(email);
  await upsertEmailAuthAccount(user, email);
  await consumeChallenge(challenge, user);

  return buildVerifyResult(user, purpose);
}

async function verifyPhoneOtp({ phone, otp, purpose, email: emailInput }) {
  const challenge = await getLatestActiveChallenge({
    phone,
    channel: "sms"
  });

  await validateOtpAgainstChallenge(challenge, otp);

  let email = normalizeEmail(emailInput) || challenge.email || null;

  if (purpose !== "forgot_pin") {
    if (!email || !isValidEmail(email)) {
      throw createAuthError(
        "Email is required when registering with phone OTP.",
        400
      );
    }
  } else {
    email = null;
  }

  if (email) {
    const emailUser = await findUserByEmail(email);
    if (
      emailUser &&
      emailUser.phone !== phone &&
      !emailUser.deletedAt &&
      emailUser.pinHash
    ) {
      throw createAuthError(
        "Email is already registered to another account.",
        409
      );
    }
  }

  const user = await findOrCreatePhoneUser(phone, email);
  await upsertPhoneAuthAccount(user, phone);
  await consumeChallenge(challenge, user);

  return buildVerifyResult(user, purpose);
}

module.exports = {
  createAndSendEmailOtp,
  createAndSendPhoneOtp,
  generateOtpCode,
  hashOtpCode,
  isEmailOtpEnabled,
  isSmsOtpEnabled,
  isValidEmail,
  normalizeEmail,
  verifyEmailOtp,
  verifyPhoneOtp
};
