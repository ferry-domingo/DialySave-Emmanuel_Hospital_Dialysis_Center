import { broadcastDataChange } from "../socket.js";

export const RESOURCE_MAP = {
  patients: ["patients", "users", "dashboard", "admission-report", "patient-portal", "doctor-portal"],
  doctors: ["doctors", "patients", "users", "dashboard", "doctor-portal"],
  "dialysis-sessions": ["dialysis-sessions", "monitoring", "admission-report", "dashboard", "patient-portal", "doctor-portal"],
  monitoring: ["dialysis-sessions", "monitoring", "admission-report", "dashboard", "patient-portal", "doctor-portal"],
  "admission-report": ["admission-report", "patients", "dashboard", "patient-portal"],
  users: ["users", "online-directory", "activity-logs", "dashboard"],
  notifications: ["notifications", "activity-logs", "dashboard"],
  announcements: ["announcements", "activity-logs"],
  "technology-gallery": ["technology-gallery", "activity-logs"],
  "site-contact": ["site-contact", "activity-logs"],
};

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const getRealtimeDescriptor = (req) => {
  if (!mutationMethods.has(req.method)) return null;
  const parts = req.path.split("/").filter(Boolean);
  const rootResource = parts[0] === "api" ? parts[1] : parts[0];
  if (!rootResource || rootResource === "messages") return null;
  if (rootResource === "monitoring" && parts.at(-1) === "preview") return null;

  let resources = RESOURCE_MAP[rootResource] || [];
  if (rootResource === "auth" && parts.includes("me")) {
    const isProfileUpdate = req.method === "PATCH" && parts.at(-1) === "me";
    const isVerifiedEmailChange = req.method === "POST" && parts.includes("verify");
    resources = isProfileUpdate || isVerifiedEmailChange ? ["profile", "users", "online-directory"] : [];
  }
  if (!resources.length) return null;
  const rootIndex = parts.indexOf(rootResource);
  const candidateId = parts[rootIndex + 1];
  return {
    resources: [...new Set(resources)], method: req.method, source: rootResource,
    entityId: candidateId && !["me", "read-all", "package-import"].includes(candidateId) ? candidateId : undefined,
  };
};

export const realtimeUpdates = (req, res, next) => {
  const descriptor = getRealtimeDescriptor(req);
  if (!descriptor) return next();

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    broadcastDataChange({ ...descriptor, actorUserId: req.user?._id ? String(req.user._id) : undefined, timestamp: new Date().toISOString() });
  });

  return next();
};
