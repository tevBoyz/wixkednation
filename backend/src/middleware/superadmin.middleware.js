function superadminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  if (req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Superadmin access required."
    });
  }

  next();
}

module.exports = superadminMiddleware;
