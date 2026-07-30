import api from "./axios";

// GET ALL DOCTORS
export const getDoctors = () => api.get("/doctors");

// GET DOCTOR BY ID
export const getDoctor = (id) => api.get(`/doctors/${id}`);

// CREATE DOCTOR
export const createDoctor = (data) => api.post("/doctors", data);

// UPDATE DOCTOR
export const updateDoctor = (id, data) =>
  api.put(`/doctors/${id}`, data);

// DELETE DOCTOR
export const deleteDoctor = (id) =>
  api.delete(`/doctors/${id}`);