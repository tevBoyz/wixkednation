function customerMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  if (req.user.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Customer access required."
    });
  }

  next();
}

module.exports = customerMiddleware;
