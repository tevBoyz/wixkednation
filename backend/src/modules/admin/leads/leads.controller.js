const {
  exportAdminLeads,
  listAdminLeadCampaigns,
  listAdminLeads,
} = require("./leads.service");

async function listLeads(req, res, next) {
  try {
    const data = await listAdminLeads(req.query || {});
    return res.status(200).json({
      success: true,
      message: "Leads fetched successfully.",
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

async function listCampaigns(req, res, next) {
  try {
    const campaigns = await listAdminLeadCampaigns();
    return res.status(200).json({
      success: true,
      message: "Lead campaigns fetched successfully.",
      data: { campaigns },
    });
  } catch (error) {
    next(error);
  }
}

async function exportLeads(req, res, next) {
  try {
    const data = await exportAdminLeads(req.query || {});
    return res.status(200).json({
      success: true,
      message: "Leads exported successfully.",
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

module.exports = {
  listLeads,
  listCampaigns,
  exportLeads,
};
