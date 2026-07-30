import { Bell, ChevronDown, LogOut, Mail, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useMessageStore } from "../../store/messageStore";
import UserAvatar from "../common/UserAvatar";
import { useNotificationStore } from "../../store/notificationStore";

const Topbar = ({ title }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const unreadCount = useMessageStore((state) =>
    state.conversations.reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0)
  );
  const unreadAlerts = useNotificationStore((state) => state.unreadCount);
  const openSettings = () => {
    setProfileOpen(false);
    navigate("/settings");
  };
  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="mb-6 flex items-center justify-between rounded-3xl bg-white px-6 py-4 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

      <div className="flex items-center gap-2">
        <Link
          to="/messages"
          aria-label="Messages"
          className="relative grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Mail size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <Link
          to="/alerts"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell size={18} />
          {unreadAlerts > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white">{unreadAlerts > 99 ? "99+" : unreadAlerts}</span>}
        </Link>

        <div className="relative ml-1">
          <button type="button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} className="flex items-center gap-3 rounded-full border border-slate-100 py-1.5 pl-1.5 pr-3 text-left transition hover:bg-slate-50">
            <UserAvatar user={user} className="h-9 w-9 text-sm" />
            <div className="hidden sm:block">
              <p className="max-w-36 truncate text-sm font-bold uppercase leading-tight text-slate-900">{user?.username || "User"}</p>
              <p className="text-xs text-slate-400">{user?.role || "Role"}</p>
            </div>
            <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${profileOpen ? "rotate-180" : ""}`} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
              <button type="button" onClick={openSettings} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                <Settings size={17} /> Settings
              </button>
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                <LogOut size={17} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
