import { create } from "zustand";
import * as api from "../api/monitoringApi";

export const useMonitoringStore = create((set, get) => ({

  monitoring: null,
  activePatientId: null,

  loading: false,

  error: null,

  fetchMonitoring: async (patientId) => {

    if (!patientId) return;

    set({
      monitoring: null,
      activePatientId: patientId,
      loading: true,
      error: null,
    });

    try {

      const { data } = await api.getPatientMonitoring(patientId);

      if (get().activePatientId === patientId) {
        set({
          monitoring: data,
          loading: false,
          error: null,
        });
      }

    } catch (error) {

      console.error("Monitoring Error:", error);

      if (get().activePatientId === patientId) {
        set({
          monitoring: null,
          loading: false,
          error:
            error.response?.data?.message ||
            "Failed to load monitoring data.",
        });
      }

    }

  },

  clearMonitoring: () =>
    set({
      monitoring: null,
      activePatientId: null,
      loading: false,
      error: null,
    }),

  setCashReason: (sessionId, reason) =>
    set((state) => {
      if (!state.monitoring?.cash?.sessions) return state;

      const sessions = state.monitoring.cash.sessions.map((session) =>
        session.id === sessionId ? { ...session, reason } : session
      );

      return {
        monitoring: {
          ...state.monitoring,
          cash: {
            ...state.monitoring.cash,
            sessions,
            reasons: sessions.map((session) => session.reason || ""),
          },
        },
      };
    }),

}));
