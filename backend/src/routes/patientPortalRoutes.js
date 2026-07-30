import express from "express";
import { buildPatientPortalData } from "../utils/patientView.js";
import { Patient } from "../models/Patient.js";
import DialysisSession from "../models/DialysisSession.js";
import { getPatientMonitoring } from "../controllers/monitoringController.js";
import { getAdmissionReport } from "../controllers/admissionReportController.js";
import { protect, roleOrOwnPatient } from "../middleware/authMiddleware.js";

const router = express.Router();

const runController = async (controller, req) => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  await controller(req, response);
  return { statusCode: response.statusCode, body: response.body };
};

router.get('/:identifier', protect, roleOrOwnPatient(), async (req, res) => {
  try {
    const { identifier } = req.params;
    const patient = await Patient.findOne(
      identifier.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: identifier }
        : { patient_id: identifier }
    ).populate('doctor');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const sessions = await DialysisSession.find({ patient: patient._id })
      .populate('patient', 'patient_id first_name last_name blood_type')
      .populate('doctor', 'doctor_id first_name last_name')
      .sort({ createdAt: -1 });

    const monitoringResult = await runController(getPatientMonitoring, {
      params: { id: patient._id.toString() },
    });

    const admissionResult = await runController(getAdmissionReport, {
      params: {},
    });

    const data = buildPatientPortalData(patient, sessions);

    return res.status(200).json({
      success: true,
      data: {
        ...data,
        monitoring: monitoringResult.statusCode === 200 ? monitoringResult.body : null,
        admissionReport:
          admissionResult.statusCode === 200
            ? (admissionResult.body?.data || []).find(
                (item) => item.patient_id === patient.patient_id
              ) || null
            : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
