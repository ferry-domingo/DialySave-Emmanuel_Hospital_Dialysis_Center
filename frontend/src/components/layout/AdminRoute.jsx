import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const AdminRoute = ({ children }) => {
  const { user, token, loading } = useAuthStore();
  if (token && (!user || loading)) {
    return <div className="p-8 text-center text-sm text-slate-400">Checking administrator access...</div>;
  }
  return user?.role === "Admin" ? children : <Navigate to="/" replace />;
};

export default AdminRoute;
