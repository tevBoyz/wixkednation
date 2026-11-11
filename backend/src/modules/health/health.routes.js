const express = require("express");
const {
  testSupabaseConnection,
  testStorageConnection
} = require("../../config/supabase");
const prisma = require("../../config/prisma");
const env = require("../../config/env");

const router = express.Router();

router.get("/", async (req, res) => {
  const dbStatus = await testSupabaseConnection();

  res.status(200).json({
    success: true,
    message: "Server is healthy",
    database: dbStatus.connected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv
  });
});

router.get("/supabase", async (req, res) => {
  const dbStatus = await testSupabaseConnection();

  if (!dbStatus.connected) {
    return res.status(500).json({
      success: false,
      message: "Supabase connection failed",
      error: dbStatus.error
    });
  }

  return res.status(200).json({
    success: true,
    message: "Supabase connection successful"
  });
});

router.get("/storage", async (req, res) => {
  const storageStatus = await testStorageConnection();

  if (!storageStatus.connected) {
    return res.status(500).json({
      success: false,
      message: "Supabase Storage connection failed",
      error: storageStatus.error
    });
  }

  return res.status(200).json({
    success: true,
    message: "Supabase Storage connection successful",
    data: {
      bucket: storageStatus.bucket,
      connected: true
    }
  });
});

router.get("/prisma", async (req, res, next) => {
  try {
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();

    return res.status(200).json({
      success: true,
      message: "Prisma connection successful",
      counts: {
        users: userCount,
        categories: categoryCount,
        products: productCount
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;