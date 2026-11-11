const {
  getAdminCustomerById,
  getAdminCustomerOrders,
  listAdminCustomers
} = require("./customers.service");

async function listCustomers(req, res, next) {
  try {
    const result = await listAdminCustomers(req.query);

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully.",
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

async function getCustomerOrders(req, res, next) {
  try {
    const result = await getAdminCustomerOrders(req.params.id, req.query);

    return res.status(200).json({
      success: true,
      message: "Customer orders fetched successfully.",
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

async function getCustomer(req, res, next) {
  try {
    const result = await getAdminCustomerById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully.",
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
  getCustomer,
  getCustomerOrders,
  listCustomers
};
