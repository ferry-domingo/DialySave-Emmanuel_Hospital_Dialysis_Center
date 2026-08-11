import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  BellRing,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  Stethoscope,
  UserCog,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import UserAvatar from "../common/UserAvatar";
import { normalizeRole, ROLES } from "../../utils/roles";

const operationalMenus = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Dialysis Sessions", icon: Activity, path: "/sessions" },
  { name: "Patients", icon: Users, path: "/patients" },
  { name: "Doctors", icon: Stethoscope, path: "/doctors" },
  { name: "Monitoring", icon: UserRoundSearch, path: "/monitoring" },
];
const admissionMenu = { name: "Admission Report", icon: IdCard, path: "/admission-report" };
const adminMenus = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Users", icon: UserCog, path: "/users" },
  { name: "Activity Logs", icon: ClipboardList, path: "/activity-logs" },
];

const messageMenu = { name: "Messages", icon: MessageCircle, path: "/messages" };
const alertsMenu = { name: "Alerts", icon: BellRing, path: "/alerts" };
const announcementsMenu = { name: "Announcements", icon: Megaphone, path: "/admin-announcements" };

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const role = normalizeRole(user?.role);
  const items = role === ROLES.PATIENT
    ? [{ name: "My Portal", icon: Users, path: "/patient-portal" }, { name: "My Sessions", icon: Activity, path: "/patient-sessions" }, alertsMenu, messageMenu]
    : role === ROLES.DOCTOR
      ? [
        { name: "My Dashboard", icon: LayoutDashboard, path: "/doctor-dashboard" },
        { name: "My Patients", icon: Users, path: "/doctor-patients" },
        { name: "Patient Sessions", icon: Activity, path: "/doctor-sessions" },
        alertsMenu,
        messageMenu,
      ]
    : role === ROLES.ADMIN
      ? [...adminMenus, announcementsMenu, messageMenu, alertsMenu]
      : [ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER].includes(role)
        ? [...operationalMenus, admissionMenu, alertsMenu, messageMenu]
        : [messageMenu];

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  };

  const openSettings = () => {
    setProfileOpen(false);
    setOpen(false);
    navigate("/settings");
  };

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${isActive ? "bg-slate-950 text-white shadow-md" : "text-black hover:bg-slate-100"
    } ${collapsed ? "md:justify-center md:bg-transparent md:p-0 md:shadow-none md:hover:bg-transparent" : ""}`;

  const iconBadgeClass = (isActive) =>
    `grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${isActive ? "bg-white/10 text-white" : "bg-slate-100 text-black group-hover:bg-white"
    } ${collapsed ? (isActive ? "md:h-11 md:w-11 md:rounded-full md:bg-slate-950 md:text-white" : "md:h-11 md:w-11 md:rounded-full") : ""}`;

  return <>
    <header className="sticky top-0 z-40 flex h-[4.5rem] items-center justify-between border-b border-slate-200 bg-white px-4 text-slate-900 shadow-sm md:hidden">
      <div className="flex items-center gap-2.5">
        <img src="/images/logo.png" alt="EHDC" className="h-9 w-9 shrink-0 object-contain" />
        <span className="text-lg font-bold">EHDC</span>
      </div>
      <button onClick={() => setOpen(!open)} aria-label="Toggle navigation" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">{open ? <X /> : <Menu />}</button>
    </header>
    {open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden" />}
    <aside
      className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden rounded-r-3xl bg-white text-slate-900 shadow-2xl transition-all duration-200 md:sticky md:top-0 md:left-auto md:inset-y-auto md:h-screen md:translate-x-0 md:rounded-none md:border-r md:border-slate-200/70 md:shadow-none ${collapsed ? "md:w-16" : "md:w-52"
        }`}
    >
      <div className={`flex items-center gap-2 border-b border-slate-100 px-4 py-3 ${collapsed ? "md:flex-col md:items-center md:gap-2" : "justify-between"}`}>
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="EHDC" className="h-10 w-10 shrink-0 object-contain" />
          <p className={`text-2xl font-extrabold tracking-tight text-slate-900 ${collapsed ? "md:hidden" : ""}`}>EHDC</p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 md:inline-flex"
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <p className={`px-4 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 ${collapsed ? "md:hidden" : ""}`}>Main menu</p>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ name, icon: Icon, path }) => (
          <NavLink key={path} to={path} onClick={() => setOpen(false)} className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconBadgeClass(isActive)}>
                  <Icon size={16} />
                </span>
                <span className={collapsed ? "md:hidden" : ""}>{name}</span>
              </>
            )}
          </NavLink>
        ))}

      </nav>

      <div className="border-t border-slate-100 p-2.5">
        {profileOpen && (
          <div className={`mb-2 space-y-1 rounded-2xl border border-slate-100 bg-white p-2 shadow-lg ${collapsed ? "md:px-1" : ""}`}>
            <button type="button" onClick={openSettings} title="Settings" className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 ${collapsed ? "md:justify-center md:px-2" : ""}`}>
              <SettingsIcon size={17} /><span className={collapsed ? "md:hidden" : ""}>Settings</span>
            </button>
            <button type="button" onClick={handleLogout} title="Log out" className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 ${collapsed ? "md:justify-center md:px-2" : ""}`}>
              <LogOut size={17} /><span className={collapsed ? "md:hidden" : ""}>Log out</span>
            </button>
          </div>
        )}
        <button type="button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} className={`flex w-full items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-50 ${collapsed ? "md:justify-center" : ""}`}>
          <UserAvatar user={user} className="h-9 w-9 text-xs" />
          <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
            <p className="whitespace-normal break-words text-[11px] font-bold uppercase leading-tight text-slate-900">{user?.name || user?.username || "User"}</p>
            <p className="truncate text-[10px] leading-tight text-slate-400">{user?.role || "Role"}</p>
          </div>
          <span className={`ml-auto text-slate-400 ${collapsed ? "md:hidden" : ""}`}>{profileOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</span>
        </button>
      </div>
    </aside>
  </>;
};

export default Sidebar;
