import mongoose from "mongoose";

const TechnologyPhotoSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 180 },
  mimeType: { type: String, required: true, enum: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
  dataUrl: { type: String, required: true },
  caption: { type: String, trim: true, maxlength: 120, default: "" },
  category: { type: String, enum: ["technology", "organization", "training"], default: "technology", index: true },
  showOnHome: { type: Boolean, default: false, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("TechnologyPhoto", TechnologyPhotoSchema);
