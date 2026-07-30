export const buildPatientPortalData = (patient, sessions = []) => ({
  profile: {
    fullName: `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim(),
    patientId: patient?.patient_id || "",
    status: patient?.status || "Active",
    doctorName: patient?.doctor
      ? `${patient.doctor.first_name || ""} ${patient.doctor.last_name || ""}`.trim()
      : "Not assigned",
    birthdate: patient?.birthdate || null,
    bloodType: patient?.blood_type || "",
  },
  summary: {
    sessionCount: sessions.length,
    doctorName: patient?.doctor
      ? `${patient.doctor.first_name || ""} ${patient.doctor.last_name || ""}`.trim()
      : "Not assigned",
    status: patient?.status || "Active",
  },
  sessions: sessions.map((session) => ({
    _id: session._id,
    session_id: session.session_id,
    createdAt: session.createdAt,
    payment_type: session.payment_type,
    doctor: session.doctor || null,
    injections: session.injections || null,
    dialyzer: session.dialyzer || null,
    intravenous_iron: session.intravenous_iron || null,
    laboratory_results: session.laboratory_results || [],
  })),
});
