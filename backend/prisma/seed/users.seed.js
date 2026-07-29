const prisma = require("../../src/config/prisma");
const { hashPin } = require("../../src/services/auth/pin.service");

async function findExistingSeedUser({ authId, phone, email }) {
  if (email) {
    const byEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive"
        }
      }
    });
    if (byEmail) {
      return byEmail;
    }
  }

  if (phone) {
    const byPhone = await prisma.user.findFirst({
      where: { phone }
    });
    if (byPhone) {
      return byPhone;
    }
  }

  return prisma.user.findFirst({
    where: { supabaseUserId: authId }
  });
}

async function upsertSeedUser({
  authId,
  name,
  phone,
  email,
  role,
  pin
}) {
  const existingUser = await findExistingSeedUser({ authId, phone, email });

  const pinHash = pin ? await hashPin(pin) : undefined;
  const pinData = pinHash
    ? {
        pinHash,
        pinSetAt: new Date(),
        pinFailedAttempts: 0,
        pinLockedUntil: null
      }
    : {};

  if (existingUser) {
    // Do not rewrite supabaseUserId — avoids unique conflicts with other seed rows.
    return prisma.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        name,
        phone,
        email,
        authProvider: existingUser.authProvider || "phone",
        role,
        deletedAt: null,
        ...pinData
      }
    });
  }

  return prisma.user.create({
    data: {
      supabaseUserId: authId,
      name,
      phone,
      email,
      authProvider: "phone",
      role,
      ...pinData
    }
  });
}

async function seedUsers() {
  const adminSupabaseUserId =
    process.env.SEED_ADMIN_SUPABASE_USER_ID ||
    process.env.SEED_ADMIN_AUTH_ID ||
    "local-seed-admin-auth-id";
  const customerSupabaseUserId =
    process.env.SEED_CUSTOMER_SUPABASE_USER_ID ||
    process.env.SEED_CUSTOMER_AUTH_ID ||
    "local-seed-customer-auth-id";
  const adminName = process.env.SEED_ADMIN_NAME || "Admin User";
  const adminPhone = process.env.SEED_ADMIN_PHONE || "+251911000000";
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@gasnation.com";
  const adminPin = process.env.SEED_ADMIN_PIN || "072326";
  const customerName = process.env.SEED_CUSTOMER_NAME || "Test Customer";
  const customerPhone = process.env.SEED_CUSTOMER_PHONE || "+251922000000";
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL || "customer@example.com";

  const adminUser = await upsertSeedUser({
    authId: adminSupabaseUserId,
    name: adminName,
    phone: adminPhone,
    email: adminEmail,
    role: "admin",
    pin: adminPin
  });

  const customerUser = await upsertSeedUser({
    authId: customerSupabaseUserId,
    name: customerName,
    phone: customerPhone,
    email: customerEmail,
    role: "customer"
  });

  return {
    adminUser,
    customerUser
  };
}

module.exports = seedUsers;
