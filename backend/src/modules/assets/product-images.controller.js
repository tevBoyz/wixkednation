const {
  downloadProductImageFromStorage
} = require("../../services/storage/storage.service");

async function streamProductImage(req, res, next) {
  try {
    const { productId, imageFile } = req.params;

    if (
      !productId ||
      !imageFile ||
      !/^[0-9a-f-]{36}\.webp$/i.test(imageFile)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product image path."
      });
    }

    const storagePath = `products/${productId}/${imageFile}`;
    const { buffer, mimeType } =
      await downloadProductImageFromStorage(storagePath);

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(buffer);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return next(error);
  }
}

module.exports = {
  streamProductImage
};
