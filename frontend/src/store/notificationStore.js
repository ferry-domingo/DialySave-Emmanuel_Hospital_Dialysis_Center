import { create } from "zustand";
import api from "../api/axios";

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/notifications");
      set({ notifications: data.data, unreadCount: data.unread, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  sendNotification: async (payload) => {
    const { data } = await api.post("/notifications", payload);
    const created = Array.isArray(data.data) ? data.data : [data.data];
    set((state) => ({ notifications: [...created, ...state.notifications] }));
    return data;
  },

  updateNotification: async (id, payload) => {
    const { data } = await api.put(`/notifications/${id}`, payload);
    set((state) => ({ notifications: state.notifications.map((item) => item._id === id ? data.data : item) }));
    return data;
  },

  deleteNotification: async (id) => {
    const { data } = await api.delete(`/notifications/${id}`);
    set((state) => ({ notifications: state.notifications.filter((item) => item._id !== id) }));
    return data;
  },

  receiveNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications.filter((item) => item._id !== notification._id)],
    unreadCount: state.unreadCount + 1,
  })),

  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((state) => ({
      notifications: state.notifications.map((item) => item._id === id ? { ...item, isRead: true } : item),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((item) => item._id === id)?.isRead ? 0 : 1)),
    }));
  },

  markAllRead: async () => {
    await api.patch("/notifications/read-all");
    set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, isRead: true })), unreadCount: 0 }));
  },
}));
