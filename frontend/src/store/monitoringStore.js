import { create } from "zustand";
import * as api from "../api/monitoringApi";

export const useMonitoringStore = create((set, get) => ({

  monitoring: null,
  activePatientId: null,
  activeYear: null,

  loading: false,

  error: null,

  fetchMonitoring: async (patientId, year, options = {}) => {

    if (!patientId) return;

    set({
      ...(options.silent ? {} : { monitoring: null }),
      activePatientId: patientId,
      activeYear: year || null,
      ...(options.silent ? {} : { loading: true }),
      error: null,
    });

    try {

      const { data } = await api.getPatientMonitoring(patientId, year);

      if (get().activePatientId === patientId && get().activeYear === (year || null)) {
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
      activeYear: null,
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

  setAgreementHeparin: (sessionId, heparin) =>
    set((state) => {
      if (!state.monitoring?.agreement?.sessions) return state;

      const sessions = state.monitoring.agreement.sessions.map((session) =>
        session.sessionId === sessionId
          ? {
              ...session,
              agreement: {
                ...session.agreement,
                heparin,
              },
            }
          : session
      );

      return {
        monitoring: {
          ...state.monitoring,
          agreement: {
            ...state.monitoring.agreement,
            sessions,
          },
        },
      };
    }),

  setAgreementSignature: (sessionId, role, signature) =>
    set((state) => {
      if (!state.monitoring?.agreement?.sessions) return state;

      const sessions = state.monitoring.agreement.sessions.map((session) =>
        session.sessionId === sessionId
          ? {
              ...session,
              agreement: {
                ...session.agreement,
                signatures: {
                  ...session.agreement?.signatures,
                  [role]: signature,
                },
              },
            }
          : session
      );

      return {
        monitoring: {
          ...state.monitoring,
          agreement: {
            ...state.monitoring.agreement,
            sessions,
          },
        },
      };
    }),

  setAgreementCopayments: (sessionId, copayments) =>
    set((state) => {
      if (!state.monitoring?.agreement?.sessions) return state;
      return {
        monitoring: {
          ...state.monitoring,
          agreement: {
            ...state.monitoring.agreement,
            sessions: state.monitoring.agreement.sessions.map((session) =>
              session.sessionId === sessionId
                ? { ...session, agreement: { ...session.agreement, copayments } }
                : session
            ),
          },
        },
      };
    }),

}));
