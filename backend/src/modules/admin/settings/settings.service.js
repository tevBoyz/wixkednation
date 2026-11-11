const crypto = require("crypto");

const prisma = require("../../../config/prisma");
const { isValidUsPhone, normalizePhone } = require("../../../utils/phone");

const ALLOWED_CURRENCIES = new Set(["ETB", "USD", "EUR", "GBP"]);
const ALLOWED_SMS_PROVIDERS = new Set(["mock", "twilio"]);

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function defaultSmsProviderConfig() {
  const hasTwilio =
    Boolean(process.env.TWILIO_ACCOUNT_SID) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.TWILIO_FROM_NUMBER);

  const envProvider = (process.env.SMS_PROVIDER || "").toLowerCase().trim();
  let provider = "mock";

  if (ALLOWED_SMS_PROVIDERS.has(envProvider)) {
    provider = envProvider;
  } else if (hasTwilio) {
    provider = "twilio";
  }

  return {
    provider,
    senderId: process.env.TWILIO_FROM_NUMBER || ""
  };
}

function normalizeAdminPhones(rawPhones) {
  if (!Array.isArray(rawPhones)) {
    return [];
  }

  return rawPhones
    .map((entry) => {
      if (typeof entry === "string") {
        const phone = normalizePhone(entry);
        if (!phone) {
          return null;
        }

        return {
          id: crypto.randomUUID(),
          phone,
          showOnBanner: false
        };
      }

      if (!entry || typeof entry !== "object") {
        return null;
      }

      const phone = normalizePhone(entry.phone);
      if (!phone) {
        return null;
      }

      return {
        id: typeof entry.id === "string" && entry.id.trim() ? entry.id : crypto.randomUUID(),
        phone,
        showOnBanner: entry.showOnBanner === true
      };
    })
    .filter(Boolean);
}

function sanitizeSmsProviderConfig(rawConfig) {
  const config =
    rawConfig && typeof rawConfig === "object" && !Array.isArray(rawConfig)
      ? rawConfig
      : {};

  const sanitized = {};

  if (typeof config.provider === "string" && config.provider.trim()) {
    const provider = config.provider.trim().toLowerCase();
    if (ALLOWED_SMS_PROVIDERS.has(provider)) {
      sanitized.provider = provider;
    }
  }

  if (typeof config.senderId === "string" && config.senderId.trim()) {
    sanitized.senderId = config.senderId.trim();
  }

  return sanitized;
}

function normalizeCurrencyCode(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw createServiceError("defaultCurrency must be a non-empty string.", 400);
  }

  const currency = value.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw createServiceError(
      "defaultCurrency must be a 3-letter ISO 4217 code (e.g. ETB, USD).",
      400
    );
  }

  if (!ALLOWED_CURRENCIES.has(currency)) {
    throw createServiceError(
      `defaultCurrency must be one of: ${[...ALLOWED_CURRENCIES].join(", ")}.`,
      400
    );
  }

  return currency;
}

async function ensureAdminSettings() {
  const existing = await prisma.adminSettings.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });

  if (existing) {
    const normalizedPhones = normalizeAdminPhones(existing.adminPhoneNumbers);
    const existingPhones = Array.isArray(existing.adminPhoneNumbers)
      ? existing.adminPhoneNumbers
      : [];
    const needsPhoneNormalization =
      JSON.stringify(normalizedPhones) !== JSON.stringify(existingPhones);

    const rawProvider =
      existing.smsProviderConfig &&
      typeof existing.smsProviderConfig === "object" &&
      !Array.isArray(existing.smsProviderConfig) &&
      typeof existing.smsProviderConfig.provider === "string"
        ? existing.smsProviderConfig.provider.trim().toLowerCase()
        : "";
    const needsSmsProviderMigration = !ALLOWED_SMS_PROVIDERS.has(rawProvider);

    if (!needsPhoneNormalization && !needsSmsProviderMigration) {
      return {
        ...existing,
        adminPhoneNumbers: normalizedPhones,
        smsProviderConfig: sanitizeSmsProviderConfig(existing.smsProviderConfig)
      };
    }

    const nextSmsConfig = needsSmsProviderMigration
      ? {
          ...sanitizeSmsProviderConfig(existing.smsProviderConfig),
          ...defaultSmsProviderConfig()
        }
      : sanitizeSmsProviderConfig(existing.smsProviderConfig);

    const updated = await prisma.adminSettings.update({
      where: {
        id: existing.id
      },
      data: {
        ...(needsPhoneNormalization ? { adminPhoneNumbers: normalizedPhones } : {}),
        ...(needsSmsProviderMigration ? { smsProviderConfig: nextSmsConfig } : {})
      }
    });

    return {
      ...updated,
      adminPhoneNumbers: normalizeAdminPhones(updated.adminPhoneNumbers),
      smsProviderConfig: sanitizeSmsProviderConfig(updated.smsProviderConfig)
    };
  }

  const created = await prisma.adminSettings.create({
    data: {
      adminPhoneNumbers: [],
      smsProviderConfig: defaultSmsProviderConfig(),
      defaultMeasurementUnit: "oz",
      defaultCurrency: "USD"
    }
  });

  return {
    ...created,
    adminPhoneNumbers: normalizeAdminPhones(created.adminPhoneNumbers),
    smsProviderConfig: sanitizeSmsProviderConfig(created.smsProviderConfig)
  };
}

function formatSettings(settings) {
  const smsProviderConfig = sanitizeSmsProviderConfig(settings.smsProviderConfig);
  const defaults = defaultSmsProviderConfig();

  return {
    id: settings.id,
    adminPhoneNumbers: normalizeAdminPhones(settings.adminPhoneNumbers),
    smsProviderConfig: {
      provider: smsProviderConfig.provider || defaults.provider,
      ...(smsProviderConfig.senderId
        ? { senderId: smsProviderConfig.senderId }
        : defaults.senderId
          ? { senderId: defaults.senderId }
          : {})
    },
    defaultMeasurementUnit: settings.defaultMeasurementUnit || "oz",
    defaultCurrency: settings.defaultCurrency || "USD",
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt
  };
}

async function getAdminSettings() {
  const settings = await ensureAdminSettings();
  return formatSettings(settings);
}

async function updateAdminSettings(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createServiceError("Request body must be a JSON object.", 400);
  }

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, "defaultMeasurementUnit")) {
    if (
      typeof payload.defaultMeasurementUnit !== "string" ||
      !payload.defaultMeasurementUnit.trim()
    ) {
      throw createServiceError("defaultMeasurementUnit must be a non-empty string.", 400);
    }
    data.defaultMeasurementUnit = payload.defaultMeasurementUnit.trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, "defaultCurrency")) {
    data.defaultCurrency = normalizeCurrencyCode(payload.defaultCurrency);
  }

  if (Object.keys(data).length === 0) {
    throw createServiceError(
      "Provide defaultMeasurementUnit and/or defaultCurrency to update.",
      400
    );
  }

  const settings = await ensureAdminSettings();

  const updated = await prisma.adminSettings.update({
    where: {
      id: settings.id
    },
    data
  });

  return formatSettings(updated);
}

async function addAdminPhone(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createServiceError("Request body must be a JSON object.", 400);
  }

  const phone = normalizePhone(payload.phone);

  if (!isValidUsPhone(phone)) {
    throw createServiceError(
      "phone must be a valid US number (e.g. +17035551234 or 7035551234).",
      400
    );
  }

  const settings = await ensureAdminSettings();
  const phones = normalizeAdminPhones(settings.adminPhoneNumbers);

  if (phones.some((entry) => entry.phone === phone)) {
    throw createServiceError("That admin phone number is already configured.", 409);
  }

  const nextPhones = [
    ...phones,
    {
      id: crypto.randomUUID(),
      phone,
      showOnBanner: payload.showOnBanner === true
    }
  ];

  const updated = await prisma.adminSettings.update({
    where: {
      id: settings.id
    },
    data: {
      adminPhoneNumbers: nextPhones
    }
  });

  return formatSettings(updated);
}

async function updateAdminPhone(phoneId, payload = {}) {
  if (!phoneId || typeof phoneId !== "string") {
    throw createServiceError("phoneId is required.", 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createServiceError("Request body must be a JSON object.", 400);
  }

  if (!Object.prototype.hasOwnProperty.call(payload, "showOnBanner")) {
    throw createServiceError("Provide showOnBanner (boolean) to update.", 400);
  }

  if (typeof payload.showOnBanner !== "boolean") {
    throw createServiceError("showOnBanner must be a boolean.", 400);
  }

  const settings = await ensureAdminSettings();
  const phones = normalizeAdminPhones(settings.adminPhoneNumbers);
  const index = phones.findIndex((entry) => entry.id === phoneId);

  if (index === -1) {
    throw createServiceError("Admin phone number not found.", 404);
  }

  const nextPhones = phones.map((entry, i) =>
    i === index
      ? {
          ...entry,
          showOnBanner: payload.showOnBanner
        }
      : entry
  );

  const updated = await prisma.adminSettings.update({
    where: {
      id: settings.id
    },
    data: {
      adminPhoneNumbers: nextPhones
    }
  });

  return formatSettings(updated);
}

async function removeAdminPhone(phoneId) {
  if (!phoneId || typeof phoneId !== "string") {
    throw createServiceError("phoneId is required.", 400);
  }

  const settings = await ensureAdminSettings();
  const phones = normalizeAdminPhones(settings.adminPhoneNumbers);
  const nextPhones = phones.filter((entry) => entry.id !== phoneId);

  if (nextPhones.length === phones.length) {
    throw createServiceError("Admin phone number not found.", 404);
  }

  const updated = await prisma.adminSettings.update({
    where: {
      id: settings.id
    },
    data: {
      adminPhoneNumbers: nextPhones
    }
  });

  return formatSettings(updated);
}

async function updateSmsSettings(payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createServiceError("Request body must be a JSON object.", 400);
  }

  const patch = {};

  if (Object.prototype.hasOwnProperty.call(payload, "provider")) {
    if (typeof payload.provider !== "string" || !payload.provider.trim()) {
      throw createServiceError("provider must be a non-empty string.", 400);
    }
    const provider = payload.provider.trim().toLowerCase();
    if (!ALLOWED_SMS_PROVIDERS.has(provider)) {
      throw createServiceError(
        `provider must be one of: ${[...ALLOWED_SMS_PROVIDERS].join(", ")}.`,
        400
      );
    }
    patch.provider = provider;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "senderId")) {
    if (typeof payload.senderId !== "string") {
      throw createServiceError("senderId must be a string.", 400);
    }
    const senderId = payload.senderId.trim();
    if (senderId) {
      patch.senderId = senderId;
    }
  }

  if (Object.keys(patch).length === 0) {
    throw createServiceError("Provide at least one of: provider, senderId.", 400);
  }

  const settings = await ensureAdminSettings();
  const currentConfig = sanitizeSmsProviderConfig(settings.smsProviderConfig);
  const defaults = defaultSmsProviderConfig();
  const nextConfig = {
    provider: currentConfig.provider || defaults.provider,
    ...(currentConfig.senderId ? { senderId: currentConfig.senderId } : {}),
    ...patch
  };

  const updated = await prisma.adminSettings.update({
    where: {
      id: settings.id
    },
    data: {
      smsProviderConfig: nextConfig
    }
  });

  return formatSettings(updated);
}

async function getStoreConfig() {
  const settings = await ensureAdminSettings();
  const phones = normalizeAdminPhones(settings.adminPhoneNumbers);
  const orderContactPhones = phones
    .filter((entry) => entry.showOnBanner)
    .map((entry) => ({
      id: entry.id,
      phone: entry.phone
    }));

  return {
    defaultCurrency: settings.defaultCurrency || "USD",
    orderContactPhones
  };
}

module.exports = {
  addAdminPhone,
  getAdminSettings,
  getStoreConfig,
  removeAdminPhone,
  updateAdminPhone,
  updateAdminSettings,
  updateSmsSettings
};
