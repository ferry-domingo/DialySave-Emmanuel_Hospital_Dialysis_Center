import { useEffect, useState } from "react";
import { Archive, ClipboardList, Filter, List, Search } from "lucide-react";
import Topbar from "../../components/layout/Topbar";
import { useUserStore } from "../../store/userStore";

const LABELS = {
  USER_LOGIN: "Signed in",
  USER_LOGOUT: "Signed out",
  LOGIN_FAILED: "Failed sign-in",
  LOGIN_BLOCKED: "Blocked sign-in",
  USER_STATUS_CHANGED: "Changed user status",
  USER_PASSWORD_CHANGED: "Changed user password",
  USER_CREATED: "Created user",
  ACCOUNT_PROFILE_UPDATED: "Updated account",
  ACCOUNT_PASSWORD_CHANGED: "Changed own password",
  PASSWORD_CHANGE_FAILED: "Failed password change",
  EMAIL_CHANGE_REQUESTED: "Requested email change",
  ACCOUNT_EMAIL_CHANGED: "Changed login email",
  PATIENT_ALERT_SENT: "Sent patient alert",
  ANNOUNCEMENT_CREATED: "Published announcement",
  ANNOUNCEMENT_UPDATED: "Updated announcement",
  ANNOUNCEMENT_DELETED: "Deleted announcement",
  NOTIFICATIONS_CREATED: "Created alert",
  NOTIFICATIONS_UPDATED: "Updated alert",
  NOTIFICATIONS_DELETED: "Deleted alert",
  PATIENTS_CREATED: "Created patient",
  PATIENTS_VIEWED: "Viewed patients",
  PATIENTS_UPDATED: "Updated patient",
  PATIENTS_DELETED: "Deleted patient",
  DOCTORS_CREATED: "Created doctor",
  DOCTORS_VIEWED: "Viewed doctors",
  DOCTORS_UPDATED: "Updated doctor",
  DOCTORS_DELETED: "Deleted doctor",
  DIALYSIS_SESSIONS_CREATED: "Created dialysis session",
  DIALYSIS_SESSIONS_VIEWED: "Viewed dialysis sessions",
  DIALYSIS_SESSIONS_UPDATED: "Updated dialysis session",
  DIALYSIS_SESSIONS_DELETED: "Deleted dialysis session",
};

const CRUD_ACTIVITIES = [
  "PATIENTS_CREATED", "PATIENTS_UPDATED", "PATIENTS_DELETED",
  "DOCTORS_CREATED", "DOCTORS_UPDATED", "DOCTORS_DELETED",
  "DIALYSIS_SESSIONS_CREATED", "DIALYSIS_SESSIONS_UPDATED", "DIALYSIS_SESSIONS_DELETED",
  "PATIENT_ALERT_SENT", "NOTIFICATIONS_CREATED", "NOTIFICATIONS_UPDATED", "NOTIFICATIONS_DELETED",
  "ANNOUNCEMENT_CREATED", "ANNOUNCEMENTS_VIEWED", "ANNOUNCEMENT_UPDATED", "ANNOUNCEMENT_DELETED",
];

const actorName = (log) => {
  if (log.actor?.role === "Patient") {
    const name = [log.actor.patient?.first_name, log.actor.patient?.middle_name, log.actor.patient?.last_name]
      .filter(Boolean).join(" ");
    if (name) return name;
  }
  return log.actor?.name || log.actor?.username || log.actorUsername || "System";
};

const accountName = (account, fallback) => {
  if (account?.role === "Patient") {
    const name = [account.patient?.first_name, account.patient?.middle_name, account.patient?.last_name]
      .filter(Boolean).join(" ");
    if (name) return name;
  }
  return account?.name || account?.username || fallback || "—";
};

const activityLabel = (action) => LABELS[action] || String(action || "Unknown activity")
  .toLowerCase()
  .replaceAll("_", " ")
  .replace(/^./, (letter) => letter.toUpperCase());

const ActivityLogsPage = () => {
  const { activityLogs, logsLoading, fetchActivityLogs } = useUserStore();
  const [archived, setArchived] = useState(false);
  const [activity, setActivity] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  useEffect(() => { fetchActivityLogs(archived); }, [fetchActivityLogs, archived]);
  const activityOptions = [...new Set([...CRUD_ACTIVITIES, ...activityLogs.map((log) => log.action).filter((action) => action && !action.endsWith("_VIEWED"))])]
    .sort((first, second) => activityLabel(first).localeCompare(activityLabel(second)));
  const userOptions = [...new Map(activityLogs
    .filter((log) => actorName(log) && actorName(log) !== "System")
    .map((log) => [actorName(log), { name: actorName(log), role: log.actor?.role || "User" }])).values()]
    .sort((first, second) => first.name.localeCompare(second.name));
  const roleOptions = [...new Set(activityLogs.map((log) => log.actor?.role || "System").filter(Boolean))].sort();
  const userTerm = userSearch.trim().toLowerCase();
  const suggestedUsers = userOptions.filter((user) =>
    [user.name, user.role].some((value) => value.toLowerCase().includes(userTerm))
  );
  const filteredLogs = activityLogs.filter((log) =>
    (activity === "all" || log.action === activity) &&
    (selectedUser === "all" || actorName(log) === selectedUser) &&
    (selectedRole === "all" || (log.actor?.role || "System") === selectedRole) &&
    (!userTerm || [actorName(log), log.actorUsername, log.actor?.username, log.actor?.name, log.actor?.role]
      .some((value) => String(value || "").toLowerCase().includes(userTerm))));

  return (
    <div className="space-y-3">
      <Topbar title="Activity Logs" />
      <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          <label className="order-2 flex min-w-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-56">
            <Filter size={14} className="shrink-0 text-slate-400" />
            <select value={activity} onChange={(event) => setActivity(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[10px] font-semibold text-slate-700 outline-none" aria-label="Filter by activity">
              <option value="all">All activities</option>
              {activityOptions.map((action) => <option key={action} value={action}>{activityLabel(action)}</option>)}
            </select>
          </label>
          <div className="group relative order-1 min-w-0 sm:w-52">
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 focus-within:border-emerald-400">
              <Search size={14} className="shrink-0 text-slate-400" />
              <input placeholder="Search user..." value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setSelectedUser("all"); }} onFocus={(event) => event.currentTarget.parentElement.parentElement.classList.add("user-search-open")} onBlur={(event) => { const wrapper = event.currentTarget.parentElement.parentElement; window.setTimeout(() => wrapper.classList.remove("user-search-open"), 150); }} className="min-w-0 flex-1 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400" />
              {(userSearch || selectedUser !== "all") && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setUserSearch(""); setSelectedUser("all"); }} className="text-xs font-bold text-slate-400 hover:text-slate-700" aria-label="Clear user filter">×</button>}
            </div>
            <div className="invisible absolute left-0 top-full z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 opacity-0 shadow-lg [scrollbar-width:none] group-focus-within:visible group-focus-within:opacity-100 [&.user-search-open]:visible [&.user-search-open]:opacity-100 [&::-webkit-scrollbar]:hidden">
              {suggestedUsers.map((user) => <button key={user.name} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSelectedUser(user.name); setUserSearch(user.name); }} className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-emerald-50"><strong className="block truncate text-[10px] text-slate-800">{user.name}</strong><span className="block truncate text-[9px] text-slate-400">{user.role}</span></button>)}
              {!suggestedUsers.length && <p className="px-2 py-3 text-center text-[9px] text-slate-400">No matching users</p>}
            </div>
          </div>
          <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} className="order-3 min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 outline-none sm:w-40" aria-label="Filter by user role">
            <option value="all">All roles</option>
            {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <button onClick={() => setArchived((value) => !value)} className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800">
          {archived ? <List size={16} /> : <Archive size={16} />}
          {archived ? "View active logs" : "View archive"}
        </button>
      </div>
      <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
        {archived ? "Archived activity older than one month." : "Active activity from the last month. Older records are archived automatically."}
      </div>
      <div className="max-h-[calc(100vh-185px)] min-w-0 max-w-full overflow-auto overscroll-contain rounded-xl bg-white shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full min-w-[640px] text-left text-xs [&_td]:!px-2.5 [&_td]:!py-1.5 [&_th]:!px-2.5 [&_th]:!py-1.5">
          <thead><tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-700">
            <th className="px-4 py-3">Date & time</th><th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Activity</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Details</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {logsLoading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Loading activity...</td></tr>}
            {!logsLoading && filteredLogs.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400"><ClipboardList className="mx-auto mb-2" /><span>{archived ? "No archived activity" : "No activity found"}</span></td></tr>}
            {filteredLogs.map((log) => <tr key={log._id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3">
                <p className="font-bold text-slate-900">{actorName(log)}</p>
                <p className="mt-0.5 text-xs text-slate-400">{log.actor?.role || "System"}</p>
              </td>
              <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">{activityLabel(log.action)}</span></td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-700">{accountName(log.target, log.targetUsername)}</p>
                {(log.target?.role || log.targetUsername) && <p className="mt-0.5 text-xs text-slate-400">{log.target?.role || "Account"}</p>}
              </td>
              <td className="max-w-64 break-words px-4 py-3 text-slate-500">{log.details || "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogsPage;
