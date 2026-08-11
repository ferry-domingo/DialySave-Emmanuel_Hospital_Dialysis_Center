import api from "./axios";

// GET DASHBOARD SUMMARY
export const getDashboardSummary = (date) => api.get("/dashboard/summary", { params: date ? { date } : undefined });
export const getAdminDashboardSummary = (filters) => api.get("/dashboard/admin-summary", { params: filters });
export const getCashierDashboardSummary = () => api.get("/dashboard/cashier-summary");
