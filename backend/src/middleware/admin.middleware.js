function isStaffRole(role) {
  return role === "admin" || role === "superadmin";
}

function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  if (!isStaffRole(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required."
    });
  }

  next();
}

module.exports = adminMiddleware;
module.exports.isStaffRole = isStaffRole;
