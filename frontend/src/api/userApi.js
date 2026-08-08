import api from "./axios";

// GET ALL USERS
export const getUsers = () => api.get("/users");
export const getOnlineDirectory = () => api.get("/users/online-directory");
export const createUser = (data) => api.post("/users", data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const updateUserStatus = (id, status) => api.patch(`/users/${id}/status`, { status });
export const updateUserPassword = (id, password) => api.patch(`/users/${id}/password`, { password });
export const getActivityLogs = (archived = false) => api.get("/activity-logs", { params: { archived } });
