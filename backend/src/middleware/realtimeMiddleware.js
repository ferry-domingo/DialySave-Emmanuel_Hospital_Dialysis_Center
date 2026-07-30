import { broadcastDataChange } from "../socket.js";

const RESOURCE_MAP = {
  patients: ["patients", "users", "dashboard"],
  doctors: ["doctors", "dashboard"],
  "dialysis-sessions": ["dialysis-sessions", "monitoring", "admission-report", "dashboard"],
  monitoring: ["monitoring", "dashboard"],
  "admission-report": ["admission-report", "dashboard"],
  users: ["users", "activity-logs"],
  notifications: ["notifications", "activity-logs", "dashboard"],
};

export const realtimeUpdates = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    const rootResource = req.path.split("/").filter(Boolean)[1];
    const resources = RESOURCE_MAP[rootResource] || [];
    for (const resource of resources) {
      broadcastDataChange(resource, {
        method: req.method,
        source: rootResource,
        timestamp: new Date().toISOString(),
      });
    }
  });

  next();
};
