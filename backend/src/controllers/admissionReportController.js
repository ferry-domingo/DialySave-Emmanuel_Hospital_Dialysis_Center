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

          admission_date: patient.createdAt,

          discharge_date:
            patient.status === "Discharged"
              ? patient.updatedAt
              : null,

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

  const patient =
    await Patient.findById(req.params.id);

  patient.info_relayed = {
    ...patient.info_relayed,
    ...req.body,
  };

  await patient.save();

  res.json({
    success: true,
    data: patient,
  });

};