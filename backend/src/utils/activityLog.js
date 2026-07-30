import ActivityLog from "../models/ActivityLog.js";
import { broadcastDataChange } from "../socket.js";

export const recordActivity = async ({
  req,
  actor,
  action,
  target = null,
  details = "",
}) => {
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
    broadcastDataChange("activity-logs", { timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Activity Log Error:", error);
  }
};
