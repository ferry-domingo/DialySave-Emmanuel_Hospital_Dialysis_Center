import { Patient } from "../models/Patient.js";

export const formatPatientId = (year, number) =>
  `EHDC-${year}-${String(number).padStart(4, "0")}`;

export const generatePatientId = async () => {
  const year = String(new Date().getFullYear());
  const patients = await Patient.find({
    patient_id: new RegExp(`^EHDC-${year}-\\d+$`),
  }).select("patient_id");
  const highestNumber = patients.reduce((highest, patient) => {
    const number = Number(patient.patient_id.split("-")[2]);
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);

  return formatPatientId(year, highestNumber + 1);
};
