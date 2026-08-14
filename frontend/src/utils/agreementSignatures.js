const cleanName = (value) => typeof value === "string" ? value.trim() : "";

export const patientName = (patient) => cleanName(
  patient?.full_name
  || patient?.fullName
  || [patient?.first_name, patient?.middle_name, patient?.last_name].filter(Boolean).join(" ")
);

export const userName = (user) => cleanName(
  user?.name
  || [user?.first_name, user?.middle_name, user?.last_name].filter(Boolean).join(" ")
  || user?.username
);

export const signatureName = (signature, fallback = "") => cleanName(
  typeof signature === "string" ? signature : signature?.name
) || cleanName(fallback);

export const signatureDate = (signature) => (
  signature && typeof signature === "object" ? signature.signedAt || null : null
);
