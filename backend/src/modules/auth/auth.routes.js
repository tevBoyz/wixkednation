const express = require("express");

const authMiddleware = require("../../middleware/auth.middleware");
const adminMiddleware = require("../../middleware/admin.middleware");
const pinSetupMiddleware = require("../../middleware/pinSetup.middleware");

const {
  getConfig,
  sendOtp,
  verifyOtp,
  setPin,
  pinLogin,
  pinChange,
  refreshToken,
  logout,
  googleStart,
  googleCallback,
  createE2eHandoff,
  exchangeCode,
  getMe,
  adminCheck
} = require("./auth.controller");

const router = express.Router();

router.get("/config", getConfig);

router.post("/otp/send", sendOtp);

router.post("/otp/verify", verifyOtp);

router.post("/pin/set", pinSetupMiddleware, setPin);

router.post("/pin/login", pinLogin);

router.post("/pin/change", authMiddleware, pinChange);

router.post("/refresh", refreshToken);

router.post("/logout", logout);

router.get("/google/start", googleStart);

router.get("/google/callback", googleCallback);

router.post("/exchange-code", exchangeCode);

if (process.env.E2E_MODE === "1") {
  router.post("/e2e/handoff", authMiddleware, createE2eHandoff);
}

router.get("/me", authMiddleware, getMe);

router.get("/admin-check", authMiddleware, adminMiddleware, adminCheck);

module.exports = router;
