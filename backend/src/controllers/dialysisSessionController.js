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
      laboratory_request,
    } = req.body;

    if (!patient_id || !doctor_id) {
      return res.status(400).json({
        success: false,
        message: "Patient and Doctor are required.",
      });
    }

    if (payment_type === "PHIC") {

        const year = new Date().getFullYear();
        const yearStart = new Date(Date.UTC(year, 0, 1));
        const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

        const totalPHIC = await DialysisSession.countDocuments({
            patient: patient_id,
            payment_type: "PHIC",
            createdAt: { $gte: yearStart, $lt: nextYearStart },
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
      laboratory_request,
    });

    const populatedSession = await DialysisSession.findById(session._id)
      .populate("patient", "patient_id first_name last_name blood_type")
      .populate("doctor", "doctor_id first_name last_name gender");

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
      .populate("doctor", "doctor_id first_name last_name gender")
      .sort({ createdAt: 1 });

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
      .populate("doctor", "doctor_id first_name last_name gender");

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
      laboratory_request,
    } = req.body;

    session.patient = patient_id ?? session.patient;
    session.doctor = doctor_id ?? session.doctor;
    session.payment_type = payment_type ?? session.payment_type;
    session.injections = injections ?? session.injections;
    session.dialyzer = dialyzer ?? session.dialyzer;
    session.intravenous_iron =
      intravenous_iron ?? session.intravenous_iron;
    session.laboratory_request =
      laboratory_request ?? session.laboratory_request;

    await session.save();

    const updatedSession = await DialysisSession.findById(session._id)
      .populate("patient", "patient_id first_name last_name blood_type")
      .populate("doctor", "doctor_id first_name last_name gender");

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

const AGREEMENT_TREATMENT_OPTIONS = {
  injection: new Set(["EPOKINE", "EPORIFE", "RECORMON"]),
  dialyzer: new Set(["Nipro Elisio 19H", "Amical Dia 19H"]),
  iron: new Set(["Encifer"]),
};

export const updateAgreementTreatment = async (req, res) => {
  try {
    const type = String(req.body.type || "");
    const name = String(req.body.name || "").trim();
    if (!AGREEMENT_TREATMENT_OPTIONS[type]?.has(name)) {
      return res.status(400).json({ success: false, message: "Choose a valid Agreement Form treatment option." });
    }

    const session = await DialysisSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found." });

    const field = type === "injection" ? "injections" : type === "iron" ? "intravenous_iron" : "dialyzer";
    session[field] = { name, payment_type: session[field]?.payment_type || "PHIC" };
    await session.save();
    return res.json({ success: true, message: "Agreement Form treatment updated.", data: { type, name } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update Agreement Form treatment." });
  }
};

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

export const updateAgreementCopayments = async (req, res) => {
  try {
    if (!Array.isArray(req.body.items)) {
      return res.status(400).json({ success: false, message: "Copayment items must be an array." });
    }

    const items = req.body.items.map((entry) => ({
      item: String(entry.item || "").trim(),
      unitQuantity: String(entry.unitQuantity || "").trim(),
      price: Number(entry.price),
    }));

    const invalidItem = items.some((entry) =>
      !entry.item || !entry.unitQuantity || !Number.isFinite(entry.price) || entry.price < 0
    );
    if (invalidItem) {
      return res.status(400).json({ success: false, message: "Each copayment item requires an item, unit/quantity, and valid price." });
    }

    const session = await DialysisSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Dialysis session not found." });
    }

    session.agreement.copayments = items;
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Copayment items updated.",
      data: session.agreement,
    });
  } catch (error) {
    console.error("Update Agreement Copayments Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update copayment items.", error: error.message });
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
    const { role, name, image = "", placement = {} } = req.body;

    if (!SIGNATURE_ROLES.includes(role) || !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid role and signer name are required.",
      });
    }

    if (role === "facilityRepresentative" && image && (!/^data:image\/png;base64,/.test(image) || image.length > 250_000)) {
      return res.status(400).json({
        success: false,
        message: "The e-signature must be a valid PNG image smaller than 250 KB.",
      });
    }

    const normalizedPlacement = {
      x: Math.max(-120, Math.min(120, Number(placement.x) || 0)),
      y: Math.max(-40, Math.min(40, Number(placement.y) || 0)),
      scale: Math.max(0.5, Math.min(2, Number(placement.scale) || 1)),
    };
    const storedImage = role === "facilityRepresentative" ? image : "";
    const storedPlacement = role === "facilityRepresentative"
      ? normalizedPlacement
      : { x: 0, y: 0, scale: 1 };

    const session = await DialysisSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Dialysis session not found.",
      });
    }

    const signedAt = new Date();
    const nextSignature = {
      name: name.trim(),
      image: storedImage,
      placement: storedPlacement,
      signedAt,
    };
    const signatureUpdates = {
      [`agreement.signatures.${role}`]: nextSignature,
    };

    if (role === "witness") {
      for (const linkedRole of ["patient", "facilityRepresentative"]) {
        if (!session.agreement.signatures[linkedRole]?.signedAt) {
          signatureUpdates[`agreement.signatures.${linkedRole}`] = {
            name: session.agreement.signatures[linkedRole]?.name || "",
            image: session.agreement.signatures[linkedRole]?.image || "",
            placement: session.agreement.signatures[linkedRole]?.placement || { x: 0, y: 0, scale: 1 },
            signedAt,
          };
        }
      }
    }

    const updatedSession = await DialysisSession.findByIdAndUpdate(
      session._id,
      { $set: signatureUpdates },
      { new: true, runValidators: true }
    );

    // The HD facility representative is shared by every agreement in the
    // system, regardless of patient or treatment session.
    if (role === "facilityRepresentative") {
      await DialysisSession.updateMany(
        { _id: { $ne: session._id } },
        { $set: {
          "agreement.signatures.facilityRepresentative.name": name.trim(),
          "agreement.signatures.facilityRepresentative.image": image,
          "agreement.signatures.facilityRepresentative.placement": normalizedPlacement,
          "agreement.signatures.facilityRepresentative.signedAt": signedAt,
        } }
      );
    }

    return res.status(200).json({
      success: true,
      message: role === "facilityRepresentative"
        ? "HD representative updated across every patient agreement."
        : "Signature recorded.",
      data: updatedSession.agreement,
      scope: role === "facilityRepresentative" ? "global" : "session",
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
