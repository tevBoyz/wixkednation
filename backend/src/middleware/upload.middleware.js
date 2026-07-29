const multer = require("multer");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Allow a larger raw upload; Sharp enforces the 3MB post-compression limit.
    fileSize: 12 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const error = new Error("Only jpg, jpeg, png, and webp images are allowed.");
      error.statusCode = 400;
      return cb(error);
    }

    return cb(null, true);
  }
});

function productImageUploadMiddleware(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image file is too large. Maximum upload size is 12MB."
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Image upload failed."
    });
  });
}

module.exports = {
  productImageUploadMiddleware
};
