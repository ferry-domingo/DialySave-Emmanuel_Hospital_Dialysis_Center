import { create } from "zustand";
import * as doctorApi from "../api/doctorApi";

export const useDoctorStore = create((set) => ({
  doctors: [],
  loading: false,
  error: null,

  fetchDoctors: async () => {
    set({ loading: true, error: null });

    try {
      const res = await doctorApi.getDoctors();

      set({
        doctors: res.data.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        loading: false,
      });
    }
  },

  createDoctor: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await doctorApi.createDoctor(data);
      set((state) => ({
        doctors: [res.data.data, ...state.doctors],
        loading: false,
      }));
      return res;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message || error.message });
      throw error;
    }
  },

  updateDoctor: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await doctorApi.updateDoctor(id, data);
      set((state) => ({
        doctors: state.doctors.map((doctor) =>
          doctor._id === id ? res.data.data : doctor
        ),
        loading: false,
      }));
      return res;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message || error.message });
      throw error;
    }
  },

  deleteDoctor: async (id) => {
    set({ loading: true, error: null });
    try {
      await doctorApi.deleteDoctor(id);
      set((state) => ({
        doctors: state.doctors.filter((doctor) => doctor._id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message || error.message });
      throw error;
    }
  },
}));
