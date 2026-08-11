import { create } from "zustand";
import api from "../api/axios";

export const useAnnouncementStore = create((set) => ({
  announcements: [],
  loading: false,
  error: "",
  fetchAnnouncements: async () => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.get("/announcements");
      set({ announcements: data.data, loading: false });
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message || "Could not load announcements." });
    }
  },
  createAnnouncement: async (payload) => {
    const { data } = await api.post("/announcements", payload);
    set((state) => ({ announcements: [data.data, ...state.announcements] }));
    return data;
  },
  updateAnnouncement: async (id, payload) => {
    const { data } = await api.put(`/announcements/${id}`, payload);
    set((state) => ({ announcements: state.announcements.map((item) => item._id === id ? data.data : item) }));
    return data;
  },
  deleteAnnouncement: async (id) => {
    const { data } = await api.delete(`/announcements/${id}`);
    set((state) => ({ announcements: state.announcements.filter((item) => item._id !== id) }));
    return data;
  },
}));
