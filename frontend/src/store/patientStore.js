import { create } from "zustand";
import * as patientApi from "../api/patientApi";

export const usePatientStore = create((set) => ({
  patients: [],
  loading: false,
  error: null,

  // GET ALL
  fetchPatients: async () => {
    set({ loading: true, error: null });

    try {
      const res = await patientApi.getPatients();

      set({
        patients: res.data.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        loading: false,
      });
    }
  },

  // CREATE
  createPatient: async (data) => {
    try {
      const res = await patientApi.createPatient(data);

      set((state) => ({
        patients: [res.data.data, ...state.patients],
      }));

      return res;
    } catch (err) {
      throw err;
    }
  },

  // UPDATE
  updatePatient: async (id, data) => {
    try {
      const res = await patientApi.updatePatient(id, data);

      set((state) => ({
        patients: state.patients.map((patient) =>
          patient._id === id ? res.data.data : patient
        ),
      }));

      return res;
    } catch (err) {
      throw err;
    }
  },

  // DELETE
  deletePatient: async (id) => {
    try {
      await patientApi.deletePatient(id);

      set((state) => ({
        patients: state.patients.filter(
          (patient) => patient._id !== id
        ),
      }));
    } catch (err) {
      throw err;
    }
  },
}));