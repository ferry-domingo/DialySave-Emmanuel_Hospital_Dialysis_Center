import { create } from "zustand";
import * as sessionApi from "../api/dialysisSessionApi";

export const useDialysisSessionStore = create((set) => ({
  sessions: [],
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true, error: null });

    try {
      const res = await sessionApi.getDialysisSessions();

      set({
        sessions: res.data.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        loading: false,
      });
    }
  },

  createSession: async (data) => {
    const res = await sessionApi.createDialysisSession(data);

    set((state) => ({
      sessions: [...state.sessions, res.data.data],
    }));

    return res;
  },

  updateSession: async (id, data) => {
    const res = await sessionApi.updateDialysisSession(id, data);

    set((state) => ({
      sessions: state.sessions.map((session) =>
        session._id === id ? res.data.data : session
      ),
    }));

    return res;
  },

  deleteSession: async (id) => {
    await sessionApi.deleteDialysisSession(id);

    set((state) => ({
      sessions: state.sessions.filter(
        (session) => session._id !== id
      ),
    }));
  },
}));
