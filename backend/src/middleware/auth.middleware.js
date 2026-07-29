const prisma = require("../config/prisma");
const { verifyAccessToken } = require("../services/auth/token.service");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Missing Bearer token."
      });
    }

    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Invalid Bearer token format."
      });
    }

    let decodedToken;

    try {
      decodedToken = verifyAccessToken(accessToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token."
      });
    }

    if (!decodedToken || !decodedToken.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token payload."
      });
    }

    const appUser = await prisma.user.findUnique({
      where: {
        id: decodedToken.sub
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

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;