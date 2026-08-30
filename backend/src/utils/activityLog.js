import ActivityLog from "../models/ActivityLog.js";
import { broadcastDataChange } from "../socket.js";

export const recordActivity = async ({
  req,
  actor,
  action,
  target = null,
  details = "",
}) => {
  if (req) req.activityRecorded = true;
  try {
    await ActivityLog.create({
      actor: actor?._id || actor?.id || null,
      actorUsername: actor?.username || "System",
      action,
      target: target?._id || target?.id || null,
      targetUsername: target?.username || "",
      details,
      ipAddress: req?.ip || "",
    });
    broadcastDataChange({
      resources: ["activity-logs"],
      method: "ACTIVITY",
      source: "activity-log",
      actorUserId: actor?._id || actor?.id ? String(actor?._id || actor?.id) : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Activity Log Error:", error);
  }
};
