const {
  createAdmin,
  disableTeamMember,
  listTeamMembers,
  patchTeamMember
} = require("./team.service");

async function listTeam(req, res, next) {
  try {
    const result = await listTeamMembers();

    return res.status(200).json({
      success: true,
      message: "Team members fetched successfully.",
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

async function createTeamAdmin(req, res, next) {
  try {
    const result = await createAdmin(req.body || {}, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Admin created successfully.",
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

async function patchTeam(req, res, next) {
  try {
    const result = await patchTeamMember(
      req.params.userId,
      req.body || {},
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Team member updated successfully.",
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

async function deleteTeam(req, res, next) {
  try {
    const result = await disableTeamMember(req.params.userId, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Team member disabled successfully.",
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
  createTeamAdmin,
  deleteTeam,
  listTeam,
  patchTeam
};
