import User from "../models/User.js";
import { hashPassword } from "../utils/auth.js";
import { recordActivity } from "../utils/activityLog.js";
import { normalizeRole, ROLES } from "../utils/roles.js";

const CREATABLE_ROLES = [ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER];

export const createUser = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = normalizeRole(req.body.role);

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 100 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "A valid email address is required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }
    if (!CREATABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Select a valid staff role." });
    }

    const duplicate = await User.findOne({ $or: [{ username: email }, { email }] });
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Email is already in use." });
    }

    const user = await User.create({
      name,
      username: email,
      email,
      password: await hashPassword(password),
      role,
      status: "Active",
    });

    await recordActivity({
      req,
      actor: req.user,
      action: "USER_CREATED",
      target: user,
      details: `Created a ${role} account.`,
    });

    const safeUser = user.toObject();
    delete safeUser.password;
    return res.status(201).json({ success: true, message: "User created successfully.", data: safeUser });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "Email is already in use." });
    }
    return res.status(500).json({ success: false, message: "Failed to create user.", error: error.message });
  }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("patient", "patient_id first_name last_name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: users.length,
      data: users.map((user) => ({ ...user.toObject(), role: normalizeRole(user.role) })),
    });
  } catch (error) {
    console.error("Get Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
      error: error.message,
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Active or Inactive." });
    }
    if (String(req.user._id) === req.params.id && status === "Inactive") {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const previousStatus = user.status;
    user.status = status;
    await user.save();
    await recordActivity({
      req,
      actor: req.user,
      action: "USER_STATUS_CHANGED",
      target: user,
      details: `Status changed from ${previousStatus} to ${status}.`,
    });

    const safeUser = user.toObject();
    delete safeUser.password;
    return res.status(200).json({ success: true, message: "User status updated.", data: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update user status.", error: error.message });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.password = await hashPassword(password);
    await user.save();
    await recordActivity({
      req,
      actor: req.user,
      action: "USER_PASSWORD_CHANGED",
      target: user,
      details: "Password was reset by an administrator.",
    });

    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update password.", error: error.message });
  }
};
