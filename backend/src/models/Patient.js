import mongoose from "mongoose";
import { formatPersonName } from "../utils/formatPersonName.js";

const patientSchema = new mongoose.Schema(
  {
    patient_id: {
      type: String,
      unique: true,
      trim: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
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
      required: true,
      enum: ["Male", "Female"],
    },

    blood_type: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    contact_number: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      default: "Active",
      trim: true,
    },

    admission_date: {
      type: Date,
      default: null,
    },

    discharge_date: {
      type: Date,
      default: null,
    },

    info_relayed: {
      nurse: {
        type: String,
        default: "",
      },
      phic_staff: {
        type: String,
        default: "",
      },
    },

  },
  {
    timestamps: true,
  }
);

export const Patient = mongoose.model("Patient", patientSchema);
