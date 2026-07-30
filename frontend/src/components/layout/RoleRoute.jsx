import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { defaultPathForRole, normalizeRole } from "../../utils/roles";

const RoleRoute = ({ allowedRoles, children }) => {
  const { user, token, loading } = useAuthStore();

  if (token && (!user || loading)) {
    return <div className="p-8 text-center text-sm text-slate-400">Checking access...</div>;
  }

  const role = normalizeRole(user?.role);
  return allowedRoles.includes(role)
    ? children
    : <Navigate to={defaultPathForRole(role)} replace />;
};

export default RoleRoute;
