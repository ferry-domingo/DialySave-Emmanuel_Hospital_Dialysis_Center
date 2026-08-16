import mongoose from "mongoose";

const SiteContactSchema = new mongoose.Schema({
  key: { type: String, default: "public-contact", unique: true, immutable: true },
  email: { type: String, trim: true, lowercase: true, maxlength: 180, default: "" },
  phone: { type: String, trim: true, maxlength: 40, default: "" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("SiteContact", SiteContactSchema);
