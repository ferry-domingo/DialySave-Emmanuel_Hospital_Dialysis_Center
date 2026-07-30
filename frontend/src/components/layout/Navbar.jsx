import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const menus = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    name: "Patients",
    icon: Users,
    path: "/patients",
  },
  {
    name: "Doctors",
    icon: UserCog,
    path: "/doctors",
  },
  {
    name: "Dialysis Sessions",
    icon: ClipboardList,
    path: "/sessions",
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="text-center text-2xl font-bold py-6 border-b border-slate-700">
        DialySave
      </div>

      <nav className="p-4 space-y-2 flex-1">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-blue-600"
                  : "hover:bg-slate-800"
              }`
            }
          >
            <menu.icon size={20} />
            {menu.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 p-4 space-y-3">
        <div className="text-sm text-slate-300">
          <p className="font-medium">{user?.username || "User"}</p>
          <p className="text-xs">{user?.role || "Role"}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-200 hover:text-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
