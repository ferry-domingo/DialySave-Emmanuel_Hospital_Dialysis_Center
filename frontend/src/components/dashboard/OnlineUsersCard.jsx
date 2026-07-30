import { useEffect, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { useUserStore } from "../../store/userStore";
import { useOnlineUsersStore } from "../../store/onlineUsersStore";
import { useAuthStore } from "../../store/authStore";
import UserAvatar from "../common/UserAvatar";

const displayName = (user) => user.role === "Patient"
  ? [user.patient?.first_name, user.patient?.last_name].filter(Boolean).join(" ") || user.name || user.username
  : user.name || user.username;

const OnlineUsersCard = () => {
  const { users, fetchUsers } = useUserStore();
  const onlineUserIds = useOnlineUsersStore((state) => state.onlineUserIds);
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = String(currentUser?._id ?? currentUser?.id ?? "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onlineUsers = users
    .filter((user) => onlineUserIds.includes(user._id) && user._id !== currentUserId)
    .filter((user) => displayName(user).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Online Users</h2>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">{onlineUsers.length}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
        <Search size={14} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
        {onlineUsers.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-400">No one else is online right now.</p>
        )}
        {onlineUsers.map((user) => (
          <div key={user._id} className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50">
            <UserAvatar user={user} name={displayName(user)} className="relative h-9 w-9 text-xs">
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </UserAvatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{displayName(user)}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
            <Link
              to={`/messages?user=${user._id}`}
              aria-label={`Message ${displayName(user)}`}
              title={`Message ${displayName(user)}`}
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
            >
              <MessageCircle size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsersCard;
