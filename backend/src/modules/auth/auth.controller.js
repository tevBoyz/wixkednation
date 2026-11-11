const { normalizePhone, isValidAccessPhone } = require("../../utils/phone");
const {
  createAndSendEmailOtp,
  createAndSendPhoneOtp,
  isValidEmail,
  normalizeEmail,
  verifyEmailOtp,
  verifyPhoneOtp
} = require("../../services/auth/otp.service");
const { getAuthConfig } = require("../../services/auth/auth-config.service");
const {
  changePin,
  loginWithPin,
  setUserPin
} = require("../../services/auth/pin.service");
const {
  logoutAuthSession,
  refreshAuthSession
} = require("../../services/auth/session.service");
const {
  buildFrontendHandoffUrl,
  createAuthHandoffCode,
  exchangeAuthHandoffCode,
  getGoogleStartUrl,
  handleGoogleCallback
} = require("../../services/auth/google.service");

function sendOtpSuccess(res, result) {
  return res.status(200).json({
    success: true,
    message: "OTP sent successfully.",
    data: {
      expiresAt: result.expiresAt,
      resendCooldownEnds: result.resendCooldownEnds,
      channel: result.channel || null
    }
  });
}

function verifyOtpSuccess(res, result) {
  if (result.requiresPinSetup) {
    return res.status(200).json({
      success: true,
      message: "OTP verified. PIN setup required.",
      data: {
        requiresPinSetup: true,
        setupToken: result.setupToken,
        user: result.user
      }
    });
  }

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully.",
    data: {
      requiresPinSetup: false,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    }
  });
}

async function getConfig(req, res, next) {
  try {
    const data = await getAuthConfig();
    return res.status(200).json({
      success: true,
      message: "Auth config fetched.",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function sendOtp(req, res, next) {
  try {
    const purpose = req.body.purpose;
    const email = normalizeEmail(req.body.email);
    const phoneRaw = req.body.phone;
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;

    if (email && phone) {
      // Register via SMS requires both; send goes to phone.
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "A valid email address is required."
        });
      }

      if (!isValidAccessPhone(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid phone number. Use a US number (e.g. +17035551234) or a test Ethiopian number (+2519… / +2517…)."
        });
      }

      const result = await createAndSendPhoneOtp(phone, { purpose, email });
      return sendOtpSuccess(res, result);
    }

    if (email && !phone) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "A valid email address is required."
        });
      }

      const result = await createAndSendEmailOtp(email, { purpose });
      return sendOtpSuccess(res, result);
    }

    if (phone && !email) {
      if (!isValidAccessPhone(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid phone number. Use a US number (e.g. +17035551234) or a test Ethiopian number (+2519… / +2517…)."
        });
      }

      // Forgot-PIN via phone may omit email; register via phone requires email (enforced in service).
      const result = await createAndSendPhoneOtp(phone, {
        purpose,
        email: null
      });
      return sendOtpSuccess(res, result);
    }

    return res.status(400).json({
      success: false,
      message: "Provide email and/or phone to send an OTP."
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

/** @deprecated Prefer sendOtp — kept as alias for older callers. */
const sendPhoneOtp = sendOtp;

async function verifyOtp(req, res, next) {
  try {
    const purpose = req.body.purpose;
    const otp = req.body.otp;
    const email = normalizeEmail(req.body.email);
    const phoneRaw = req.body.phone;
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;

    if (email && !phone) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "A valid email address is required."
        });
      }

      const result = await verifyEmailOtp({ email, otp, purpose });
      return verifyOtpSuccess(res, result);
    }

    if (phone) {
      if (!isValidAccessPhone(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid phone number. Use a US number (e.g. +17035551234) or a test Ethiopian number (+2519… / +2517…)."
        });
      }

      const result = await verifyPhoneOtp({
        phone,
        otp,
        purpose,
        email
      });
      return verifyOtpSuccess(res, result);
    }

    return res.status(400).json({
      success: false,
      message: "Provide email or phone to verify an OTP."
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function setPin(req, res, next) {
  try {
    const result = await setUserPin(req.user.id, {
      pin: req.body.pin,
      confirmPin: req.body.confirmPin
    });

    return res.status(200).json({
      success: true,
      message: "PIN set successfully.",
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function pinLogin(req, res, next) {
  try {
    const result = await loginWithPin({
      phone: req.body.phone,
      email: req.body.email,
      pin: req.body.pin
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function pinChange(req, res, next) {
  try {
    const result = await changePin(req.user.id, {
      currentPin: req.body.currentPin,
      newPin: req.body.newPin,
      confirmPin: req.body.confirmPin
    });

    return res.status(200).json({
      success: true,
      message: "PIN changed successfully.",
      data: {
        user: result.user
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const result = await refreshAuthSession(req.body.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await logoutAuthSession(req.body.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function googleStart(req, res, next) {
  try {
    const authUrl = getGoogleStartUrl();
    return res.redirect(authUrl);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function googleCallback(req, res, next) {
  try {
    if (req.query.error) {
      return res.redirect(
        buildFrontendHandoffUrl({
          error: String(req.query.error)
        })
      );
    }

    const result = await handleGoogleCallback({
      code: req.query.code,
      state: req.query.state
    });

    return res.redirect(
      buildFrontendHandoffUrl({
        handoffCode: result.handoffCode
      })
    );
  } catch (error) {
    if (error.statusCode) {
      return res.redirect(
        buildFrontendHandoffUrl({
          error: error.message
        })
      );
    }

    next(error);
  }
}

async function exchangeCode(req, res, next) {
  try {
    const code = req.body.code;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        message: "Auth handoff code is required."
      });
    }

    const result = await exchangeAuthHandoffCode(code);

    if (result.requiresPinSetup) {
      return res.status(200).json({
        success: true,
        message: "Google sign-in verified. PIN setup required.",
        data: {
          requiresPinSetup: true,
          setupToken: result.setupToken,
          user: result.user
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Auth handoff code exchanged successfully.",
      data: {
        requiresPinSetup: false,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function createE2eHandoff(req, res, next) {
  try {
    const refreshTokenValue = req.body.refreshToken;
    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!accessToken || !refreshTokenValue) {
      return res.status(400).json({
        success: false,
        message: "Bearer access token and body.refreshToken are required."
      });
    }

    const code = createAuthHandoffCode({
      accessToken,
      refreshToken: refreshTokenValue,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: "E2E auth handoff code created.",
      data: {
        code
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}

async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    message: "Authenticated user fetched successfully.",
    user: req.user
  });
}

async function adminCheck(req, res) {
  return res.status(200).json({
    success: true,
    message: "Admin access confirmed.",
    user: req.user
  });
}

module.exports = {
  getConfig,
  sendOtp,
  sendPhoneOtp,
  verifyOtp,
  setPin,
  pinLogin,
  pinChange,
  refreshToken,
  logout,
  googleStart,
  googleCallback,
  exchangeCode,
  createE2eHandoff,
  getMe,
  adminCheck
};
