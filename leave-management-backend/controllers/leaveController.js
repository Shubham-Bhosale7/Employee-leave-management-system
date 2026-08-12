const Leave = require("../models/Leave");
const User = require("../models/User");

const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (user.leaveBalance[leaveType] < days) {
      return res.status(400).json({ message: "Insufficient leave balance" });
    }

    const leave = new Leave({
      userId: req.user.id,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    await leave.save();

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ userId: req.user.id })
      .populate("reviewedBy", "name")
      .sort({ appliedDate: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    if (req.user.role === "employee") {
      return res.status(403).json({ message: "Access denied" });
    }

    const leaves = await Leave.find()
      .populate("userId", "name email department")
      .populate("reviewedBy", "name")
      .sort({ appliedDate: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    if (req.user.role === "employee") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status, comments } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    leave.status = status;
    leave.comments = comments;
    leave.reviewedBy = req.user.id;
    leave.reviewDate = new Date();

    await leave.save();

    if (status === "approved") {
      const user = await User.findById(leave.userId);
      if (user) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        user.leaveBalance[leave.leaveType] -= days;
        await user.save();
      }
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
};
