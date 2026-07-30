import { create } from "zustand";
import * as api from "../api/admissionReportApi";

export const useAdmissionReportStore = create((set) => ({
  reports: [],
  loading: false,

  fetchReports: async () => {
    set({ loading: true });

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
  await api.updateInfoRelayed(id, data);

  set((state) => ({
    reports: state.reports.map((r) =>
      r._id === id
        ? {
            ...r,
            info_relayed: {
              ...r.info_relayed,
              ...data,
            },
          }
        : r
    ),
  }));
} 
}));