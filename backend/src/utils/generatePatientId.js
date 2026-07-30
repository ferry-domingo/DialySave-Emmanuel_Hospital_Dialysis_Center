import { Patient } from "../models/Patient.js";

export const generatePatientId = async () => {
  const year = new Date().getFullYear();

  const latestPatient = await Patient.findOne()
    .sort({ createdAt: -1 });

  let number = 1;

  if (latestPatient?.patient_id) {
    const parts = latestPatient.patient_id.split("-");

    number = Number(parts[2]) + 1;
  }

  return `PAT-${year}-${String(number).padStart(4, "0")}`;
};