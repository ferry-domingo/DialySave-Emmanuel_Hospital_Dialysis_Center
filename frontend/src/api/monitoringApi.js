import api from "./axios";

export const getPatientMonitoring = (id, year) =>
  api.get(`/monitoring/${id}`, { params: year ? { year } : undefined });

export const getDoctorAgreementBulk = (doctorId, startSession, endSession) =>
  api.get("/monitoring/agreement-bulk", { params: { doctorId, startSession, endSession } });

const excelForm = (file) => {
  const form = new FormData();
  form.append("file", file);
  return form;
};

export const previewPackageImport = (id, file) =>
  api.post(`/monitoring/${id}/package-import/preview`, excelForm(file), { headers: { "Content-Type": "multipart/form-data" } });

export const importPackage = (id, file) =>
  api.post(`/monitoring/${id}/package-import`, excelForm(file), { headers: { "Content-Type": "multipart/form-data" } });
