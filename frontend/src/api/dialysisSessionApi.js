import api from "./axios";

// GET ALL DIALYSIS SESSIONS
export const getDialysisSessions = () =>
  api.get("/dialysis-sessions");

// GET DIALYSIS SESSION BY ID
export const getDialysisSession = (id) =>
  api.get(`/dialysis-sessions/${id}`);

// CREATE DIALYSIS SESSION
export const createDialysisSession = (data) =>
  api.post("/dialysis-sessions", data);

// UPDATE DIALYSIS SESSION
export const updateDialysisSession = (id, data) =>
  api.put(`/dialysis-sessions/${id}`, data);

// DELETE DIALYSIS SESSION
export const deleteDialysisSession = (id) =>
  api.delete(`/dialysis-sessions/${id}`);

// ACKNOWLEDGE AGREEMENT
export const acknowledgeAgreement = (id, data) =>
  api.patch(`/dialysis-sessions/${id}/agreement/acknowledge`, data);

// SIGN AGREEMENT
export const signAgreement = (id, data) =>
  api.patch(`/dialysis-sessions/${id}/agreement/sign`, data);

export const updateAgreementHeparin = (id, heparin) =>
  api.patch(`/dialysis-sessions/${id}/agreement/heparin`, { heparin });

export const updateCashReason = (id, reason) =>
  api.patch(`/dialysis-sessions/${id}/cash-reason`, { reason });
