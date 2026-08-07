export const doctorPrefix = (doctor) =>
  String(doctor?.gender || "").toLowerCase() === "female" ? "DRA." : "DR.";

export const formatDoctorName = (doctor, { lastNameOnly = false } = {}) => {
  if (!doctor) return "";
  const name = lastNameOnly
    ? doctor.last_name
    : [doctor.first_name, doctor.middle_name, doctor.last_name].filter(Boolean).join(" ");
  return name ? `${doctorPrefix(doctor)} ${name}` : "";
};
