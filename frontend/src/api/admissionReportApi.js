import axios from "./axios";

export const getAdmissionReport = () =>
  axios.get("/admission-report");

export const updateInfoRelayed = (id, data) =>
  axios.put(`/admission-report/${id}`, data);