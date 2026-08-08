import AdminDashboard from "./AdminDashboardCompact";
import Dashboard from "./Dashboard";
import { useAuthStore } from "../store/authStore";
import { normalizeRole, ROLES } from "../utils/roles";

const HomeDashboard = () => {
  const role = normalizeRole(useAuthStore((state) => state.user?.role));
  if (role === ROLES.ADMIN) return <AdminDashboard />;
  return <Dashboard />;
};

export default HomeDashboard;
