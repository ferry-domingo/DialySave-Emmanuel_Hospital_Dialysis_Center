import { create } from "zustand";
import * as userApi from "../api/userApi";

export const useUserStore = create((set) => ({
  users: [],
  onlineDirectory: [],
  loading: false,
  error: null,
  activityLogs: [],
  logsLoading: false,

  fetchUsers: async () => {
    set({ loading: true, error: null });

    try {
      const res = await userApi.getUsers();

      set({
        users: res.data.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        loading: false,
      });
    }
  },

  fetchOnlineDirectory: async () => {
    try {
      const res = await userApi.getOnlineDirectory();
      set({ onlineDirectory: res.data.data });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message });
    }
  },

  createUser: async (data) => {
    const res = await userApi.createUser(data);
    set((state) => ({ users: [res.data.data, ...state.users] }));
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await userApi.updateUserStatus(id, status);
    set((state) => ({
      users: state.users.map((user) => user._id === id ? res.data.data : user),
    }));
    return res.data;
  },

  updatePassword: async (id, password) => {
    const res = await userApi.updateUserPassword(id, password);
    return res.data;
  },

  fetchActivityLogs: async (archived = false) => {
    set({ logsLoading: true, error: null });
    try {
      const res = await userApi.getActivityLogs(archived);
      set({ activityLogs: res.data.data, logsLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message,
        logsLoading: false,
      });
    }
  },
}));
