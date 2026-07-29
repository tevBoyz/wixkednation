const {
  addAdminPhone,
  getAdminSettings,
  removeAdminPhone,
  updateAdminPhone,
  updateAdminSettings,
  updateSmsSettings
} = require("./settings.service");

async function getSettings(req, res, next) {
  try {
    const settings = await getAdminSettings();

    return res.status(200).json({
      success: true,
      message: "Admin settings fetched successfully.",
      data: {
        settings
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

async function patchSettings(req, res, next) {
  try {
    const settings = await updateAdminSettings(req.body || {});

    return res.status(200).json({
      success: true,
      message: "Admin settings updated successfully.",
      data: {
        settings
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

async function createAdminPhone(req, res, next) {
  try {
    const settings = await addAdminPhone(req.body || {});

    return res.status(201).json({
      success: true,
      message: "Admin phone number added successfully.",
      data: {
        settings
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

async function patchAdminPhone(req, res, next) {
  try {
    const settings = await updateAdminPhone(req.params.phoneId, req.body || {});

    return res.status(200).json({
      success: true,
      message: "Admin phone number updated successfully.",
      data: {
        settings
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

async function deleteAdminPhone(req, res, next) {
  try {
    const settings = await removeAdminPhone(req.params.phoneId);

    return res.status(200).json({
      success: true,
      message: "Admin phone number removed successfully.",
      data: {
        settings
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

async function patchSms(req, res, next) {
  try {
    const settings = await updateSmsSettings(req.body || {});

    return res.status(200).json({
      success: true,
      message: "SMS settings updated successfully.",
      data: {
        settings
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
  createAdminPhone,
  deleteAdminPhone,
  getSettings,
  patchAdminPhone,
  patchSettings,
  patchSms
};
