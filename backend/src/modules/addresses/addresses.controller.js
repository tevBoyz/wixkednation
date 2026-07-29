const {
  createAddress,
  listAddresses,
  softDeleteAddress,
  updateAddress
} = require("./addresses.service");

async function list(req, res, next) {
  try {
    const addresses = await listAddresses(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully.",
      data: {
        addresses
      }
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const address = await createAddress(req.user.id, req.body || {});

    return res.status(201).json({
      success: true,
      message: "Address created successfully.",
      data: {
        address
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

async function update(req, res, next) {
  try {
    const address = await updateAddress(
      req.user.id,
      req.params.addressId,
      req.body || {}
    );

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      data: {
        address
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

async function remove(req, res, next) {
  try {
    const address = await softDeleteAddress(
      req.user.id,
      req.params.addressId
    );

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
      data: {
        address
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

module.exports = {
  create,
  list,
  remove,
  update
};
