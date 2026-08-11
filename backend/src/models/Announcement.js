import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    media: [{
      kind: { type: String, enum: ["image"], required: true },
      mimeType: { type: String, required: true },
      name: { type: String, default: "attachment", maxlength: 180 },
      dataUrl: { type: String, required: true },
    }],
    audience: [{
      type: String,
      enum: ["Admin", "Philhealth Officer", "Cashier", "Patient", "Doctor"],
    }],
    priority: { type: String, enum: ["Normal", "Important", "Urgent"], default: "Normal" },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

export default mongoose.model("Announcement", AnnouncementSchema);
