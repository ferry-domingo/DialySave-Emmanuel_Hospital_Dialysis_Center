import { useEffect, useState } from "react";
import { Archive, ClipboardList, List, Search } from "lucide-react";
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
};

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

const ActivityLogsPage = () => {
  const { activityLogs, logsLoading, fetchActivityLogs } = useUserStore();
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);

  useEffect(() => { fetchActivityLogs(archived); }, [fetchActivityLogs, archived]);
  const term = search.trim().toLowerCase();
  const filteredLogs = activityLogs.filter((log) =>
    [actorName(log), log.actor?.role, log.actorUsername, log.action, LABELS[log.action], accountName(log.target, log.targetUsername), log.target?.role, log.details]
      .some((value) => String(value || "").toLowerCase().includes(term)) ||
    JSON.stringify(log).toLowerCase().includes(term)
  );

  return (
    <div className="space-y-3">
      <Topbar title="Activity Logs" />
      <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-56">
          <Search size={16} className="text-slate-400" />
          <input placeholder="Search activity..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400" />
        </div>
        <button onClick={() => setArchived((value) => !value)} className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800">
          {archived ? <List size={16} /> : <Archive size={16} />}
          {archived ? "View active logs" : "View archive"}
        </button>
      </div>
      <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
        {archived ? "Archived activity older than one month." : "Active activity from the last month. Older records are archived automatically."}
      </div>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-xs [&_td]:!px-2.5 [&_td]:!py-1.5 [&_th]:!px-2.5 [&_th]:!py-1.5">
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
              <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">{LABELS[log.action] || log.action}</span></td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-700">{accountName(log.target, log.targetUsername)}</p>
                {(log.target?.role || log.targetUsername) && <p className="mt-0.5 text-xs text-slate-400">{log.target?.role || "Account"}</p>}
              </td>
              <td className="px-4 py-3 text-slate-500">{log.details || "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogsPage;
