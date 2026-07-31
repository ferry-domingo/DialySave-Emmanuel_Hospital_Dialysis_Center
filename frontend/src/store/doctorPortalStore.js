import { create } from "zustand";
import api from "../api/axios";

export const useDoctorPortalStore = create((set) => ({
  data: null,
  loading: false,
  error: "",

  fetchPortal: async () => {
    set({ loading: true, error: "" });
    try {
      const response = await api.get("/doctors/me/dashboard");
      set({ data: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Unable to load your doctor portal.",
        loading: false,
      });
      throw error;
    }
  },
}));
