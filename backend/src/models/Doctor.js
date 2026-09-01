import mongoose from "mongoose";
import { formatPersonName } from "../utils/formatPersonName.js";

const doctorSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    first_name: {
      type: String,
      required: true,
      trim: true,
      set: formatPersonName,
    },

    last_name: {
      type: String,
      required: true,
      trim: true,
      set: formatPersonName,
    },

    middle_name: {
      type: String,
      trim: true,
      set: formatPersonName,
    },

    birthdate: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    contact_number: {
      type: String,
      trim: true,
    },

    medical_expertise: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      default: "Active",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);
