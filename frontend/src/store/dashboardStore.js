import { create } from "zustand";
import * as dashboardApi from "../api/dashboardApi";

export const useDashboardStore = create((set) => ({
  summary: null,
  adminSummary: null,
  cashierSummary: null,
  loading: false,
  error: null,

  fetchSummary: async (date) => {
    set({ loading: true, error: null });

    try {
      const res = await dashboardApi.getDashboardSummary(date);

      set({
        summary: res.data.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        loading: false,
      });
    }
  },

  fetchAdminSummary: async () => {
    set({ loading: true, error: null });
    try {
      const res = await dashboardApi.getAdminDashboardSummary();
      set({ adminSummary: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  fetchCashierSummary: async () => {
    set({ loading: true, error: null });
    try {
      const res = await dashboardApi.getCashierDashboardSummary();
      set({ cashierSummary: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },
}));
