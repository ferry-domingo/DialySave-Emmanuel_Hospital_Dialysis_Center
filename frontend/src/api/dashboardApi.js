import api from "./axios";

// GET DASHBOARD SUMMARY
export const getDashboardSummary = () => api.get("/dashboard/summary");
export const getAdminDashboardSummary = () => api.get("/dashboard/admin-summary");
export const getCashierDashboardSummary = () => api.get("/dashboard/cashier-summary");
