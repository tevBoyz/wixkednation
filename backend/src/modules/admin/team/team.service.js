const { randomUUID } = require("crypto");

const prisma = require("../../../config/prisma");
const {
  hashPin,
  mapSafeUser,
  validatePin
} = require("../../../services/auth/pin.service");

function createTeamError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    throw createTeamError("Email is required.", 400);
  }

  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw createTeamError("A valid email is required.", 400);
  }

  return normalized;
}

function mapTeamMember(user) {
  return {
    ...mapSafeUser(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
    isDisabled: Boolean(user.deletedAt)
  };
}

async function countActiveSuperadmins(excludeUserId) {
  return prisma.user.count({
    where: {
      role: "superadmin",
      deletedAt: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {})
    }
  });
}

async function listTeamMembers() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["admin", "superadmin"]
      }
    },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }]
  });

  return {
    items: users.map(mapTeamMember),
    total: users.length
  };
}

async function createAdmin({ email, pin, name }, actorUserId) {
  if (!actorUserId) {
    throw createTeamError("Authentication required.", 401);
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPin = validatePin(pin);
  const displayName =
    typeof name === "string" && name.trim() ? name.trim() : null;

  const existing = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive"
      }
    }
  });

  if (existing && !existing.deletedAt) {
    throw createTeamError("A user with this email already exists.", 409);
  }

  const pinHash = await hashPin(normalizedPin);
  const pinData = {
    pinHash,
    pinSetAt: new Date(),
    pinFailedAttempts: 0,
    pinLockedUntil: null
  };

  let user;

  if (existing && existing.deletedAt) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: displayName || existing.name,
        email: normalizedEmail,
        authProvider: "email",
        role: "admin",
        deletedAt: null,
        ...pinData
      }
    });
  } else {
    user = await prisma.user.create({
      data: {
        supabaseUserId: `local-admin:${normalizedEmail}:${randomUUID()}`,
        name: displayName,
        email: normalizedEmail,
        authProvider: "email",
        role: "admin",
        ...pinData
      }
    });
  }

  return {
    user: mapTeamMember(user),
    credentials: {
      email: normalizedEmail,
      pin: normalizedPin
    }
  };
}

async function getStaffUserOrThrow(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    throw createTeamError("Staff user not found.", 404);
  }

  return user;
}

async function patchTeamMember(userId, body, actorUserId) {
  if (!actorUserId) {
    throw createTeamError("Authentication required.", 401);
  }

  if (userId === actorUserId) {
    throw createTeamError("You cannot modify your own staff account.", 400);
  }

  const target = await getStaffUserOrThrow(userId);
  const restore = Boolean(body?.restore);
  const nextRole = body?.role;

  if (restore) {
    if (!target.deletedAt) {
      throw createTeamError("User is not disabled.", 400);
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { deletedAt: null }
    });

    return mapTeamMember(updated);
  }

  if (nextRole !== undefined) {
    if (nextRole !== "admin" && nextRole !== "customer") {
      throw createTeamError(
        'role must be "admin" or "customer". Cannot promote to superadmin.',
        400
      );
    }

    if (target.role === "superadmin" && nextRole !== "superadmin") {
      const remaining = await countActiveSuperadmins(target.id);
      if (remaining < 1 && !target.deletedAt) {
        throw createTeamError(
          "Cannot demote the last active superadmin.",
          400
        );
      }
    }

    if (nextRole === "customer") {
      const updated = await prisma.user.update({
        where: { id: target.id },
        data: {
          role: "customer",
          deletedAt: null
        }
      });
      return mapTeamMember(updated);
    }

    if (target.role === "superadmin") {
      throw createTeamError(
        "Cannot change a superadmin to admin via this API.",
        400
      );
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        role: "admin",
        deletedAt: null
      }
    });
    return mapTeamMember(updated);
  }

  throw createTeamError("Provide role and/or restore: true.", 400);
}

async function disableTeamMember(userId, actorUserId) {
  if (!actorUserId) {
    throw createTeamError("Authentication required.", 401);
  }

  if (userId === actorUserId) {
    throw createTeamError("You cannot disable your own account.", 400);
  }

  const target = await getStaffUserOrThrow(userId);

  if (target.deletedAt) {
    throw createTeamError("User is already disabled.", 400);
  }

  if (target.role === "superadmin") {
    const remaining = await countActiveSuperadmins(target.id);
    if (remaining < 1) {
      throw createTeamError(
        "Cannot disable the last active superadmin.",
        400
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { deletedAt: new Date() }
  });

  return mapTeamMember(updated);
}

module.exports = {
  createAdmin,
  disableTeamMember,
  listTeamMembers,
  patchTeamMember
};
