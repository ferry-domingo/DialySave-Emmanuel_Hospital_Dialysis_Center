import mongoose from "mongoose";

const DialysisSessionSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    payment_type: {
      type: String,
      enum: ["PHIC", "PCSO", "CASH", "MISC / V.A.S"],
      default: "PHIC",
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    injections: {
      name: {
        type: String,
      },

      payment_type: {
        type: String,
        enum: ["PHIC", "PCSO", "CASH"],
        default: "PHIC",
      },
    },

    dialyzer: {
      name: {
        type: String,
      },

      payment_type: {
        type: String,
        enum: ["PHIC", "PCSO", "CASH"],
        default: "PHIC",
      },
    },

    intravenous_iron: {
      name: {
        type: String,
      },

      payment_type: {
        type: String,
        enum: ["PHIC", "PCSO", "CASH"],
        default: "PHIC",
      },
    },

    laboratory_results: [
      {
        name: {
          type: String,
          required: true,
        },

        done: {
          type: Boolean,
          default: false,
        },
      },
    ],

    agreement: {
      heparin: {
        type: String,
        enum: [
          "Heparin sodium 1000 IU/mL, 5 mL vial",
          "Heparin sodium 5000 IU/mL, 5 mL vial",
          "Heparin sodium 1000 IU/mL, 30 mL vial",
          "Heparin sodium 5000 IU/mL, 30 mL vial",
        ],
        default: "Heparin sodium 5000 IU/mL, 5 mL vial",
      },
      acknowledgement: {
        informedConsent: { type: Boolean, default: true },
        itemsAcknowledged: { type: Boolean, default: true },
      },

      signatures: {
        patient: {
          name: { type: String, default: "" },
          signedAt: { type: Date, default: null },
        },
        witness: {
          name: { type: String, default: "" },
          signedAt: { type: Date, default: null },
        },
        facilityRepresentative: {
          name: { type: String, default: "" },
          signedAt: { type: Date, default: null },
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("DialysisSession", DialysisSessionSchema);
