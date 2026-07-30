import DialysisSession from "../models/DialysisSession.js";
import { generateSessionId } from "../utils/generateSessionId.js";

// CREATE DIALYSIS SESSION
export const createDialysisSession = async (req, res) => {
  try {
    const session_id = await generateSessionId();

    const {
      patient_id,
      doctor_id,
      payment_type,
      injections,
      dialyzer,
      intravenous_iron,
      laboratory_results,
    } = req.body;

    if (!patient_id || !doctor_id) {
      return res.status(400).json({
        success: false,
        message: "Patient and Doctor are required.",
      });
    }

    if (payment_type === "PHIC") {

        const totalPHIC = await DialysisSession.countDocuments({
            patient: patient_id,
            payment_type: "PHIC",
        });

        if (totalPHIC >= 156) {
            return res.status(400).json({
                success: false,
                message: "PHIC limit of 156 sessions has been reached."
            });
        }
    }

    const session = await DialysisSession.create({
      session_id,
      patient: patient_id,
      doctor: doctor_id,
      payment_type,
      injections,
      dialyzer,
      intravenous_iron,
      laboratory_results,
    });

    const populatedSession = await DialysisSession.findById(session._id)
      .populate("patient", "patient_id first_name last_name blood_type")
      .populate("doctor", "doctor_id first_name last_name");

    return res.status(201).json({
      success: true,
      message: "Dialysis session created successfully.",
      data: populatedSession,
    });
  } catch (error) {
    console.error("Create Dialysis Session Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL DIALYSIS SESSIONS
export const getDialysisSessions = async (req, res) => {
  try {
    const sessions = await DialysisSession.find()
      .populate("patient", "patient_id first_name last_name blood_type")
      .populate("doctor", "doctor_id first_name last_name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("Get Dialysis Sessions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dialysis sessions.",
      error: error.message,
    });
  }
};

// GET SESSION BY ID
export const getDialysisSessionById = async (req, res) => {
  try {
    const session = await DialysisSession.findById(req.params.id)
      .populate("patient", "patient_id first_name last_name blood_type")
      .populate("doctor", "doctor_id first_name last_name");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Dialysis session not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Get Dialysis Session Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dialysis session.",
      error: error.message,
    });
  }
};

// UPDATE SESSION
export const updateDialysisSession = async (req, res) => {
  try {
    const session = await DialysisSession.findById(req.params.id)
      .populate("patient")
      .populate("doctor");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Dialysis session not found.",
      });
    }

    const {
      patient_id,
      doctor_id,
      payment_type,
      injections,
      dialyzer,
      intravenous_iron,
      laboratory_results,
    } = req.body;

    session.patient = patient_id ?? session.patient;
    session.doctor = doctor_id ?? session.doctor;
    session.payment_type = payment_type ?? session.payment_type;
    session.injections = injections ?? session.injections;
    session.dialyzer = dialyzer ?? session.dialyzer;
    session.intravenous_iron =
      intravenous_iron ?? session.intravenous_iron;
    session.laboratory_results =
      laboratory_results ?? session.laboratory_results;

    await session.save();

    const updatedSession = await DialysisSession.findById(session._id)
      .populate("patient", "patient_id first_name last_name blood_type")
      .populate("doctor", "doctor_id first_name last_name");

    return res.status(200).json({
      success: true,
      message: "Dialysis session updated successfully.",
      data: updatedSession,
    });
  } catch (error) {
    console.error("Update Dialysis Session Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update dialysis session.",
      error: error.message,
    });
  }
};

const HEPARIN_OPTIONS = new Set([
  "Heparin sodium 1000 IU/mL, 5 mL vial",
  "Heparin sodium 5000 IU/mL, 5 mL vial",
  "Heparin sodium 1000 IU/mL, 30 mL vial",
  "Heparin sodium 5000 IU/mL, 30 mL vial",
]);

export const updateAgreementHeparin = async (req, res) => {
  try {
    const heparin = String(req.body.heparin || "");
    if (!HEPARIN_OPTIONS.has(heparin)) {
      return res.status(400).json({ success: false, message: "Choose a valid Heparin option." });
    }
    const session = await DialysisSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found." });
    session.agreement.heparin = heparin;
    await session.save();
    return res.json({ success: true, message: "Heparin selection updated.", data: session.agreement });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update Heparin selection." });
  }
};

export const updateCashReason = async (req, res) => {
  try {
    const session = await DialysisSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Dialysis session not found." });
    }

    if (session.payment_type !== "CASH") {
      return res.status(400).json({ success: false, message: "A reason can only be added to cash sessions." });
    }

    session.reason = String(req.body.reason || "").trim();
    await session.save();

    return res.json({
      success: true,
      message: "Cash treatment reason updated.",
      data: { reason: session.reason },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update cash treatment reason.",
    });
  }
};

// ACKNOWLEDGE AGREEMENT
export const acknowledgeAgreement = async (req, res) => {
  try {
    const { informedConsent, itemsAcknowledged } = req.body;

    const session = await DialysisSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Dialysis session not found.",
      });
    }

    session.agreement.acknowledgement.informedConsent = Boolean(informedConsent);
    session.agreement.acknowledgement.itemsAcknowledged = Boolean(itemsAcknowledged);

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Agreement acknowledgement updated.",
      data: session.agreement,
    });
  } catch (error) {
    console.error("Acknowledge Agreement Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update agreement acknowledgement.",
      error: error.message,
    });
  }
};

// SIGN AGREEMENT
const SIGNATURE_ROLES = ["patient", "witness", "facilityRepresentative"];

export const signAgreement = async (req, res) => {
  try {
    const { role, name } = req.body;

    if (!SIGNATURE_ROLES.includes(role) || !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid role and signer name are required.",
      });
    }

    const session = await DialysisSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Dialysis session not found.",
      });
    }

    session.agreement.signatures[role] = {
      name: name.trim(),
      signedAt: new Date(),
    };

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Signature recorded.",
      data: session.agreement,
    });
  } catch (error) {
    console.error("Sign Agreement Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record signature.",
      error: error.message,
    });
  }
};

// DELETE SESSION
export const deleteDialysisSession = async (req, res) => {
  try {
    const session = await DialysisSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Dialysis session not found.",
      });
    }

    await session.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Dialysis session deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Dialysis Session Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete dialysis session.",
      error: error.message,
    });
  }
};
