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

const OnlineUsersCard = ({ embedded = false }) => {
  const { onlineDirectory, fetchOnlineDirectory } = useUserStore();
  const onlineUserIds = useOnlineUsersStore((state) => state.onlineUserIds);
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = String(currentUser?._id ?? currentUser?.id ?? "");
  const [search, setSearch] = useState("");
  const [previewUser, setPreviewUser] = useState(null);

  useEffect(() => {
    fetchOnlineDirectory();
  }, [fetchOnlineDirectory]);

  const visibleUsers = onlineDirectory
    .filter((user) => String(user._id) !== currentUserId)
    .filter((user) => displayName(user).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aOnline = onlineUserIds.includes(String(a._id));
      const bOnline = onlineUserIds.includes(String(b._id));
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      return displayName(a).localeCompare(displayName(b));
    });
  const onlineCount = visibleUsers.filter((user) => onlineUserIds.includes(String(user._id))).length;

  return (
    <div className={`flex h-full min-h-0 min-w-0 flex-col p-3 ${embedded ? "" : "rounded-xl border border-slate-200/70 bg-white shadow-sm"}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Online Users</h2>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600">{onlineCount}/{visibleUsers.length} online</span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
        <Search size={14} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleUsers.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-400">No matching users.</p>
        )}
        {visibleUsers.map((user) => {
          const isOnline = onlineUserIds.includes(String(user._id));
          return (
          <div key={user._id} className="group flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-slate-50">
            <button type="button" onClick={() => setPreviewUser(user)} aria-label={`View ${displayName(user)} profile picture`} className="shrink-0 rounded-full transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300">
              <UserAvatar user={user} name={displayName(user)} className="relative h-7 w-7 text-[9px]">
                <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
              </UserAvatar>
            </button>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold leading-tight text-slate-800">{displayName(user)}</p>
              <p className="truncate text-[8px] leading-tight text-slate-400">{user.role} · <span className={isOnline ? "font-semibold text-emerald-600" : "text-slate-400"}>{isOnline ? "Online" : "Offline"}</span></p>
            </div>
            <Link
              to={`/messages?user=${user._id}`}
              aria-label={`Message ${displayName(user)}`}
              title={`Message ${displayName(user)}`}
              className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
            >
              <MessageCircle size={13} />
            </Link>
          </div>
          );
        })}
      </div>

      {previewUser && (
        <div role="dialog" aria-modal="true" aria-label={`${displayName(previewUser)} profile picture`} onClick={() => setPreviewUser(null)} className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div onClick={(event) => event.stopPropagation()} className="rounded-2xl bg-white p-4 text-center shadow-2xl">
            <UserAvatar user={previewUser} name={displayName(previewUser)} className="mx-auto h-28 w-28 text-2xl" />
            <p className="mt-3 max-w-48 truncate text-sm font-bold text-slate-900">{displayName(previewUser)}</p>
            <p className="text-[10px] text-slate-500">{previewUser.role}</p>
            <button type="button" onClick={() => setPreviewUser(null)} className="mt-3 rounded-lg bg-slate-100 px-4 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersCard;
