const {
  addCartItem,
  clearCart,
  getCartForUser,
  mergeGuestCart,
  removeCartItem,
  updateCartItem
} = require("./cart.service");

async function getCart(req, res, next) {
  try {
    const cart = await getCartForUser(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully.",
      data: {
        cart
      }
    });
  } catch (error) {
    next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const cart = await addCartItem(req.user.id, req.body || {});

    return res.status(201).json({
      success: true,
      message: "Item added to cart successfully.",
      data: {
        cart
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

async function updateItem(req, res, next) {
  try {
    const cart = await updateCartItem(
      req.user.id,
      req.params.itemId,
      req.body || {}
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully.",
      data: {
        cart
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

async function removeItem(req, res, next) {
  try {
    const cart = await removeCartItem(req.user.id, req.params.itemId);

    return res.status(200).json({
      success: true,
      message: "Cart item removed successfully.",
      data: {
        cart
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

async function clear(req, res, next) {
  try {
    const cart = await clearCart(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      data: {
        cart
      }
    });
  } catch (error) {
    next(error);
  }
}

async function merge(req, res, next) {
  try {
    const result = await mergeGuestCart(req.user.id, req.body || {});

    return res.status(200).json({
      success: true,
      message: "Guest cart merged successfully.",
      data: result
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

module.exports = {
  addItem,
  clear,
  getCart,
  merge,
  removeItem,
  updateItem
};
