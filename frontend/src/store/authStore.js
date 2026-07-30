import { create } from "zustand";
import axios from "../api/axios";
import { normalizeRole } from "../utils/roles";

const normalizeUser = (user) => user ? { ...user, role: normalizeRole(user.role) } : user;

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: Boolean(localStorage.getItem("token")),
  loading: false,
  error: null,

  login: async (loginId, password) => {
    set({ loading: true, error: null });

    try {
      const res = await axios.post("/auth/login", { loginId, password });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      set({ user: normalizeUser(user), token, isAuthenticated: true, loading: false });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
    } catch {
      // Always clear the local session, even if the server is unavailable.
    } finally {
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false, error: null });
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      const res = await axios.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ user: normalizeUser(res.data.user), isAuthenticated: true, loading: false });
    } catch (err) {
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  updateProfile: async (profile) => {
    const res = await axios.patch("/auth/me", profile);
    set({ user: normalizeUser(res.data.user) });
    return res.data;
  },

  requestEmailChange: async (email) => {
    const res = await axios.post("/auth/me/email/request", { email }, { timeout: 20000 });
    return res.data;
  },

  verifyEmailChange: async (code) => {
    const res = await axios.post("/auth/me/email/verify", { code });
    set({ user: normalizeUser(res.data.user) });
    return res.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await axios.patch("/auth/me/password", { currentPassword, newPassword });
    return res.data;
  },
}));
