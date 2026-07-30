import { create } from "zustand";

export const useOnlineUsersStore = create((set) => ({
  onlineUserIds: [],
  setOnlineUserIds: (ids) => set({ onlineUserIds: ids }),
}));
