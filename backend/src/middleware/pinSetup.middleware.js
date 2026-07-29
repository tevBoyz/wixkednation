const {
  PIN_SETUP_PURPOSE,
  verifyPinSetupToken
} = require("../services/auth/pin.service");
const prisma = require("../config/prisma");

async function pinSetupMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "PIN setup token required. Missing Bearer token."
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "PIN setup token required. Invalid Bearer token format."
      });
    }

    let decoded;

    try {
      decoded = verifyPinSetupToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || "Invalid or expired PIN setup token."
      });
    }

    if (decoded.purpose !== PIN_SETUP_PURPOSE) {
      return res.status(401).json({
        success: false,
        message: "Invalid PIN setup token purpose."
      });
    }

    const appUser = await prisma.user.findUnique({
      where: {
        id: decoded.sub
      }
    });

    if (!appUser || appUser.deletedAt) {
      return res.status(403).json({
        success: false,
        message: "User account not found or disabled."
      });
    }

    req.user = {
      id: appUser.id,
      name: appUser.name,
      phone: appUser.phone,
      email: appUser.email,
      authProvider: appUser.authProvider,
      role: appUser.role
    };
    req.pinSetup = true;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = pinSetupMiddleware;
