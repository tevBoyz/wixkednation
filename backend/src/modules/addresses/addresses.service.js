const prisma = require("../../config/prisma");
const { isValidEthiopianPhone, normalizePhone } = require("../../utils/phone");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value, fieldName = "id") {
  if (!value || typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw createServiceError(`Invalid ${fieldName}.`, 400);
  }

  return value;
}

function mapAddress(address) {
  return {
    id: address.id,
    userId: address.userId,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    country: address.country,
    latitude: address.latitude,
    longitude: address.longitude,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
    deletedAt: address.deletedAt
  };
}

function requireNonEmptyString(value, fieldName) {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw createServiceError(`${fieldName} is required.`, 400);
  }

  return value.trim();
}

function parseOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createServiceError("Invalid string field.", 400);
  }

  return value.trim() || null;
}

function parseOptionalBoolean(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw createServiceError(`${fieldName} must be a boolean.`, 400);
  }

  return value;
}

function parseOptionalCoordinate(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw createServiceError(`${fieldName} must be a number.`, 400);
  }

  return parsed;
}

function normalizeAddressPhone(phone) {
  const normalized = normalizePhone(phone);

  if (!normalized || !isValidEthiopianPhone(normalized)) {
    throw createServiceError(
      "phone must be a valid Ethiopian number (+2519XXXXXXXX or +2517XXXXXXXX).",
      400
    );
  }

  return normalized;
}

async function clearDefaultAddresses(userId, excludeId = null) {
  await prisma.address.updateMany({
    where: {
      userId,
      isDefault: true,
      deletedAt: null,
      ...(excludeId
        ? {
            NOT: {
              id: excludeId
            }
          }
        : {})
    },
    data: {
      isDefault: false
    }
  });
}

async function listAddresses(userId) {
  const addresses = await prisma.address.findMany({
    where: {
      userId,
      deletedAt: null
    },
    orderBy: [
      {
        isDefault: "desc"
      },
      {
        createdAt: "desc"
      }
    ]
  });

  return addresses.map(mapAddress);
}

async function getOwnedAddress(userId, addressId, { includeDeleted = false } = {}) {
  assertUuid(addressId, "addressId");

  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
      ...(includeDeleted
        ? {}
        : {
            deletedAt: null
          })
    }
  });

  if (!address) {
    throw createServiceError("Address not found.", 404);
  }

  return address;
}

async function createAddress(userId, payload = {}) {
  const fullName = requireNonEmptyString(payload.fullName, "fullName");
  const phone = normalizeAddressPhone(payload.phone);
  const addressLine1 = requireNonEmptyString(payload.addressLine1, "addressLine1");
  const city = requireNonEmptyString(payload.city, "city");

  const label = parseOptionalString(payload.label);
  const addressLine2 = parseOptionalString(payload.addressLine2);
  const state = parseOptionalString(payload.state);
  const country =
    typeof payload.country === "string" && payload.country.trim()
      ? payload.country.trim()
      : "Ethiopia";
  const latitude = parseOptionalCoordinate(payload.latitude, "latitude");
  const longitude = parseOptionalCoordinate(payload.longitude, "longitude");
  const isDefault = parseOptionalBoolean(payload.isDefault, "isDefault") ?? false;

  if (isDefault) {
    await clearDefaultAddresses(userId);
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label: label === undefined ? null : label,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 === undefined ? null : addressLine2,
      city,
      state: state === undefined ? null : state,
      country,
      latitude: latitude === undefined ? null : latitude,
      longitude: longitude === undefined ? null : longitude,
      isDefault
    }
  });

  return mapAddress(address);
}

async function updateAddress(userId, addressId, payload = {}) {
  const existing = await getOwnedAddress(userId, addressId);
  const data = {};

  if (payload.label !== undefined) {
    data.label = parseOptionalString(payload.label);
  }

  if (payload.fullName !== undefined) {
    data.fullName = requireNonEmptyString(payload.fullName, "fullName");
  }

  if (payload.phone !== undefined) {
    data.phone = normalizeAddressPhone(payload.phone);
  }

  if (payload.addressLine1 !== undefined) {
    data.addressLine1 = requireNonEmptyString(payload.addressLine1, "addressLine1");
  }

  if (payload.addressLine2 !== undefined) {
    data.addressLine2 = parseOptionalString(payload.addressLine2);
  }

  if (payload.city !== undefined) {
    data.city = requireNonEmptyString(payload.city, "city");
  }

  if (payload.state !== undefined) {
    data.state = parseOptionalString(payload.state);
  }

  if (payload.country !== undefined) {
    data.country = requireNonEmptyString(payload.country, "country");
  }

  if (payload.latitude !== undefined) {
    data.latitude = parseOptionalCoordinate(payload.latitude, "latitude");
  }

  if (payload.longitude !== undefined) {
    data.longitude = parseOptionalCoordinate(payload.longitude, "longitude");
  }

  if (payload.isDefault !== undefined) {
    data.isDefault = parseOptionalBoolean(payload.isDefault, "isDefault");
  }

  if (Object.keys(data).length === 0) {
    throw createServiceError("No address fields provided to update.", 400);
  }

  if (data.isDefault === true) {
    await clearDefaultAddresses(userId, existing.id);
  }

  const address = await prisma.address.update({
    where: {
      id: existing.id
    },
    data
  });

  return mapAddress(address);
}

async function softDeleteAddress(userId, addressId) {
  const existing = await getOwnedAddress(userId, addressId);

  const address = await prisma.address.update({
    where: {
      id: existing.id
    },
    data: {
      deletedAt: new Date(),
      isDefault: false
    }
  });

  return mapAddress(address);
}

module.exports = {
  createAddress,
  listAddresses,
  softDeleteAddress,
  updateAddress
};
