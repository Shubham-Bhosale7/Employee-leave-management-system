const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} = require("../controllers/leaveController");

router.post("/", authenticateToken, applyLeave);
router.get("/my-leaves", authenticateToken, getMyLeaves);
router.get("/", authenticateToken, getAllLeaves);
router.patch("/:id", authenticateToken, updateLeaveStatus);

module.exports = router;
