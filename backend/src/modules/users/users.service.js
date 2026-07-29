const prisma = require("../../config/prisma");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  authProvider: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

function mapUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    authProvider: user.authProvider,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null
    },
    select: userSelect
  });

  if (!user) {
    throw createServiceError("User account not found or disabled.", 403);
  }

  return mapUser(user);
}

async function updateCurrentUser(userId, payload = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createServiceError("Request body must be a JSON object.", 400);
  }

  const forbiddenFields = [
    "phone",
    "role",
    "reputationScore",
    "deliveredOrderCount",
    "cancelledOrderCount",
    "authProvider",
    "id",
    "supabaseUserId"
  ];

  for (const field of forbiddenFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      throw createServiceError(`${field} cannot be updated through this endpoint.`, 400);
    }
  }

  const hasName = Object.prototype.hasOwnProperty.call(payload, "name");
  const hasEmail = Object.prototype.hasOwnProperty.call(payload, "email");

  if (!hasName && !hasEmail) {
    throw createServiceError("At least one of name or email is required.", 400);
  }

  const data = {};

  if (hasName) {
    if (payload.name !== null && typeof payload.name !== "string") {
      throw createServiceError("name must be a string or null.", 400);
    }

    const trimmedName =
      payload.name === null || payload.name === undefined
        ? null
        : payload.name.trim();

    data.name = trimmedName || null;
  }

  if (hasEmail) {
    if (payload.email !== null && typeof payload.email !== "string") {
      throw createServiceError("email must be a string or null.", 400);
    }

    const trimmedEmail =
      payload.email === null || payload.email === undefined
        ? null
        : payload.email.trim().toLowerCase();

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      throw createServiceError("Invalid email format.", 400);
    }

    data.email = trimmedEmail || null;
  }

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        deletedAt: null,
        NOT: {
          id: userId
        }
      },
      select: {
        id: true
      }
    });

    if (existing) {
      throw createServiceError("Email is already in use.", 409);
    }
  }

  try {
    const user = await prisma.user.update({
      where: {
        id: userId
      },
      data,
      select: userSelect
    });

    return mapUser(user);
  } catch (error) {
    if (error.code === "P2002") {
      throw createServiceError("Email is already in use.", 409);
    }

    throw error;
  }
}

module.exports = {
  getCurrentUser,
  updateCurrentUser
};
