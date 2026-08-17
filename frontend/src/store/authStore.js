import { create } from "zustand";
import axios from "../api/axios";
import { normalizeRole } from "../utils/roles";

const normalizeUser = (user) => user ? { ...user, role: normalizeRole(user.role) } : user;
const getStoredToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const clearStoredToken = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};

export const useAuthStore = create((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: Boolean(getStoredToken()),
  loading: false,
  error: null,

  login: async (loginId, password, rememberMe = false) => {
    set({ loading: true, error: null });

    try {
      const res = await axios.post("/auth/login", { loginId, password, rememberMe });
      const { token, user } = res.data;

      clearStoredToken();
      (rememberMe ? localStorage : sessionStorage).setItem("token", token);
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
      clearStoredToken();
      set({ user: null, token: null, isAuthenticated: false, error: null });
    }
  },

  requestPasswordReset: async (identifier) => {
    const res = await axios.post("/auth/password/forgot", { identifier }, { timeout: 20000 });
    return res.data;
  },

  verifyPasswordResetCode: async (identifier, code) => {
    const res = await axios.post("/auth/password/verify", { identifier, code });
    return res.data;
  },

  resetPassword: async (resetToken, newPassword) => {
    const res = await axios.post("/auth/password/reset", { resetToken, newPassword });
    return res.data;
  },

  loadUser: async () => {
    const token = getStoredToken();

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
      clearStoredToken();
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
