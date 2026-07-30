import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorUsername: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    targetUsername: { type: String, default: "", trim: true },
    details: { type: String, default: "", trim: true },
    ipAddress: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("ActivityLog", ActivityLogSchema);
