import { verifyAuthToken } from "../utils/auth.js";
import User from "../models/User.js";
import { normalizeRole, ROLES } from "../utils/roles.js";
import { recordActivity } from "../utils/activityLog.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const METHOD_ACTION = {
  POST: "CREATED",
  PUT: "UPDATED",
  PATCH: "UPDATED",
  DELETE: "DELETED",
};

const resourceFor = (req) => {
  const pathParts = String(req.originalUrl || req.baseUrl || "system")
    .split("?")[0]
    .split("/")
    .filter(Boolean);
  const apiIndex = pathParts.indexOf("api");
  return (pathParts[apiIndex + 1] || pathParts[0] || "system")
    .replaceAll("-", "_")
    .toUpperCase();
};

const automaticActionFor = (req) => `${resourceFor(req)}_${req.method === "GET" ? "VIEWED" : METHOD_ACTION[req.method] || "CHANGED"}`;

const attachAutomaticActivityLog = (req, res) => {
  if (!WRITE_METHODS.has(req.method) || req.activityLogAttached) return;
  req.activityLogAttached = true;

  res.once("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400 || req.activityRecorded) return;
    void recordActivity({
      req,
      actor: req.user,
      action: automaticActionFor(req),
      details: `${req.method} ${String(req.originalUrl || req.baseUrl || "").split("?")[0]} completed successfully.`,
    });
  });
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAuthToken(token);
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("patient", "patient_id first_name middle_name last_name")
      .populate("doctor", "doctor_id first_name middle_name last_name gender status");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact an administrator.",
      });
    }

    if (user.role === ROLES.LEGACY_PHIC_STAFF) {
      user.role = ROLES.PHILHEALTH_OFFICER;
      await user.save();
    }

    req.user = user;
    attachAutomaticActivityLog(req, res);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (normalizeRole(req.user?.role) !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Administrator access is required.",
    });
  }
  next();
};

export const roleOnly = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(normalizeRole(req.user?.role))) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this resource.",
    });
  }
  next();
};

export const roleOrOwnPatient = (...allowedRoles) => (req, res, next) => {
  const role = normalizeRole(req.user?.role);
  if (allowedRoles.includes(role)) return next();

  const patient = req.user?.patient;
  const patientId = patient?._id || patient;
  const patientCode = patient?.patient_id;
  const requestedPatient = req.params.id || req.params.identifier;
  if (
    role === ROLES.PATIENT &&
    (String(patientId || "") === requestedPatient || patientCode === requestedPatient)
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "You may only access your own patient record.",
  });
};
