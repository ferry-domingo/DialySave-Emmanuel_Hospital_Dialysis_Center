import ActivityLog from "../models/ActivityLog.js";

export const getActivityLogs = async (req, res) => {
  try {
    const archiveBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const archived = req.query.archived === "true";
    const logs = await ActivityLog.find({
      createdAt: archived ? { $lt: archiveBefore } : { $gte: archiveBefore },
    })
      .populate({
        path: "actor",
        select: "username name role patient",
        populate: { path: "patient", select: "first_name middle_name last_name patient_id" },
      })
      .populate({
        path: "target",
        select: "username name role patient",
        populate: { path: "patient", select: "first_name middle_name last_name patient_id" },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, total: logs.length, archived, archiveBefore, data: logs });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve activity logs.",
      error: error.message,
    });
  }
};
