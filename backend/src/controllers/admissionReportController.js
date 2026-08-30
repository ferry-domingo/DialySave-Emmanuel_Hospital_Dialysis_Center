import { Patient } from "../models/Patient.js";
import DialysisSession from "../models/DialysisSession.js";

export const getAdmissionReport = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });

    const report = await Promise.all(
      patients.map(async (patient) => {
        const totalSessions = await DialysisSession.countDocuments({
          patient: patient._id,
        });

        return {
          _id: patient._id,

          patient_id: patient.patient_id,

          full_name:
            patient.first_name +
            " " +
            patient.last_name,

          admission_date: patient.admission_date || patient.createdAt,

          discharge_date: patient.discharge_date || null,

          dialysis_sessions: totalSessions,

          hospital: "EHDC",

          info_relayed: {
            nurse: patient.info_relayed?.nurse || "",
            phic_staff: patient.info_relayed?.phic_staff || "",
          },

          status: patient.status,
        };
      })
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateInfoRelayed = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });

    const parseDateInput = (value, fieldName, required = false) => {
      const text = String(value ?? "").trim();
      if (!text) {
        if (required) throw new Error(`${fieldName} is required.`);
        return null;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`${fieldName} must be a valid date.`);
      const date = new Date(`${text}T12:00:00.000Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) throw new Error(`${fieldName} must be a valid date.`);
      return date;
    };

    const admissionDate = parseDateInput(req.body.admission_date, "Admission date", true);
    const dischargeDate = parseDateInput(req.body.discharge_date, "Discharge date");
    if (dischargeDate && dischargeDate < admissionDate) {
      return res.status(400).json({ success: false, message: "Discharge date cannot be earlier than admission date." });
    }

    patient.info_relayed = {
      ...patient.info_relayed,
      nurse: String(req.body.nurse || "").trim(),
      phic_staff: String(req.body.phic_staff || "").trim(),
    };
    patient.admission_date = admissionDate;
    patient.discharge_date = dischargeDate;
    await patient.save();

    return res.json({
      success: true,
      data: {
        admission_date: patient.admission_date,
        discharge_date: patient.discharge_date,
        info_relayed: patient.info_relayed,
      },
    });
  } catch (error) {
    const validationError = /required|valid date/i.test(error.message || "");
    return res.status(validationError ? 400 : 500).json({ success: false, message: error.message || "Failed to update admission report." });
  }
};
