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
    const res = await doctorApi.createDoctor(data);

    set((state) => ({
      doctors: [res.data.data, ...state.doctors],
    }));

    return res;
  },

  updateDoctor: async (id, data) => {
    const res = await doctorApi.updateDoctor(id, data);

    set((state) => ({
      doctors: state.doctors.map((doctor) =>
        doctor._id === id ? res.data.data : doctor
      ),
    }));

    return res;
  },

  deleteDoctor: async (id) => {
    await doctorApi.deleteDoctor(id);

    set((state) => ({
      doctors: state.doctors.filter(
        (doctor) => doctor._id !== id
      ),
    }));
  },
}));