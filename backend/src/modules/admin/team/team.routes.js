const express = require("express");

const authMiddleware = require("../../../middleware/auth.middleware");
const superadminMiddleware = require("../../../middleware/superadmin.middleware");

const {
  createTeamAdmin,
  deleteTeam,
  listTeam,
  patchTeam
} = require("./team.controller");

const router = express.Router();

router.use(authMiddleware, superadminMiddleware);

router.get("/", listTeam);
router.post("/", createTeamAdmin);
router.patch("/:userId", patchTeam);
router.delete("/:userId", deleteTeam);

module.exports = router;
