import { Doctor } from "../models/Doctor.js";

export const formatDoctorId = (year, sequence) =>
  `DOC-${year}-${String(sequence).padStart(4, "0")}`;

export const generateDoctorId = async () => {
  const year = new Date().getFullYear();
  const prefix = `DOC-${year}-`;

  const latestDoctor = await Doctor.findOne({
    doctor_id: { $regex: `^${prefix}\\d{4}$` },
  }).sort({ doctor_id: -1 });

  const latestSequence = latestDoctor
    ? Number(latestDoctor.doctor_id.slice(prefix.length))
    : 0;

  return formatDoctorId(year, latestSequence + 1);
};
