import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { normalizeRole, ROLES } from "./utils/roles";

function App() {
  const isAdmin = normalizeRole(useAuthStore((state) => state.user?.role)) === ROLES.ADMIN;

  return <>
    <AppRoutes />
    <Toaster position="top-right" containerClassName={isAdmin ? "admin-toast-region" : ""} />
  </>;
}

export default App;
