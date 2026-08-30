import { create } from "zustand";
import * as api from "../api/admissionReportApi";

export const useAdmissionReportStore = create((set) => ({
  reports: [],
  loading: false,

  fetchReports: async (options = {}) => {
    if (!options.silent) set({ loading: true });

    try {
      const res = await api.getAdmissionReport();

      set({
        reports: res.data.data,
        loading: false,
      });
    } catch (err) {
      console.log(err);

      set({
        loading: false,
      });
    }
  },

  updateInfo: async (id, data) => {
  const response = await api.updateInfoRelayed(id, data);
  const updated = response.data.data;

  set((state) => ({
    reports: state.reports.map((r) =>
      r._id === id
        ? {
            ...r,
            admission_date: updated.admission_date,
            discharge_date: updated.discharge_date,
            info_relayed: updated.info_relayed,
          }
        : r
    ),
  }));
} 
}));
