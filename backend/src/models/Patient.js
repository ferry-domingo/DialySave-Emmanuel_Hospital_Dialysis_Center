import mongoose from "mongoose";

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
    },

    last_name: {
      type: String,
      required: true,
      trim: true,
    },

    middle_name: {
      type: String,
      trim: true,
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