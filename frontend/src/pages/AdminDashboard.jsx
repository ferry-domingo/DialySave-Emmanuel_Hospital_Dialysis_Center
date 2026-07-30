import { useEffect } from "react";
import { Activity, BellRing, ChevronRight, CircleAlert, MailWarning, ShieldAlert, ShieldCheck, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Topbar from "../components/layout/Topbar";
import OnlineUsersCard from "../components/dashboard/OnlineUsersCard";
import { useAuthStore } from "../store/authStore";
import { useDashboardStore } from "../store/dashboardStore";
import { useOnlineUsersStore } from "../store/onlineUsersStore";

const ROLE_COLORS = ["#0f172a", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

const ACTION_LABELS = {
  USER_LOGIN: "Signed in",
  USER_LOGOUT: "Signed out",
  LOGIN_FAILED: "Failed sign-in",
  LOGIN_BLOCKED: "Blocked sign-in",
  USER_STATUS_CHANGED: "Changed account status",
  USER_PASSWORD_CHANGED: "Reset a user password",
  USER_CREATED: "Created a user",
  ACCOUNT_PROFILE_UPDATED: "Updated account profile",
  ACCOUNT_PASSWORD_CHANGED: "Changed password",
  PATIENT_ALERT_SENT: "Sent a patient alert",
};

const AdminMetric = ({ icon: Icon, label, value, note, tone }) => (
  <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value ?? "—"}</p>
      </div>
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></span>
    </div>
    <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">{note}</p>
  </div>
);

const actorName = (log) => log.actor?.name || log.actor?.username || log.actorUsername || "System";

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const { adminSummary, loading, error, fetchAdminSummary } = useDashboardStore();
  const onlineUserIds = useOnlineUsersStore((state) => state.onlineUserIds);

  useEffect(() => { fetchAdminSummary(); }, [fetchAdminSummary]);

  const stats = adminSummary?.stats;
  const roles = adminSummary?.usersByRole ?? [];
  const roleTotal = roles.reduce((total, item) => total + item.count, 0);
  const activeRate = stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const attention = adminSummary?.needsAttention;
  const attentionTotal = (attention?.inactiveAccounts ?? 0)
    + (attention?.pendingEmailChanges ?? 0)
    + (attention?.securityEventsToday ?? 0);

  return (
    <div className="space-y-5">
      <Topbar title="Admin Dashboard" />

      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-24 w-40 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <ShieldCheck size={14} /> Administrator control center
            </div>
            <h1 className="max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">
              Good day, {user?.name || user?.username || "Administrator"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Review account health, security events, and recent system activity from one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-black">{onlineUserIds.length}</p>
              <p className="text-xs font-semibold text-slate-400">Online now</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-2xl font-black">{activeRate}%</p>
              <p className="text-xs font-semibold text-slate-400">Active accounts</p>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric icon={Users} label="Total accounts" value={stats?.totalUsers} note={`${stats?.newUsersThisWeek ?? 0} created in the last 7 days`} tone="bg-slate-100 text-slate-700" />
        <AdminMetric icon={UserCheck} label="Active accounts" value={stats?.activeUsers} note={`${stats?.inactiveUsers ?? 0} inactive accounts`} tone="bg-emerald-50 text-emerald-600" />
        <AdminMetric icon={Activity} label="Activity today" value={stats?.activityToday} note="Recorded audit events since midnight" tone="bg-blue-50 text-blue-600" />
        <AdminMetric icon={CircleAlert} label="Security events" value={stats?.failedLoginsToday} note="Failed or blocked sign-ins today" tone={stats?.failedLoginsToday ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"} />
      </section>

      <section className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><ShieldAlert size={21} /></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900">Needs attention</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${attentionTotal ? "bg-amber-500 text-white" : "bg-emerald-100 text-emerald-700"}`}>{attentionTotal}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{attentionTotal ? "Items that may require an administrator review" : "No account or security issues require action"}</p>
            </div>
          </div>
          <Link to="/activity-logs" className="inline-flex items-center gap-1 self-start rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 sm:self-auto">Review activity <ChevronRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          <Link to="/users" className="group flex items-center gap-3 p-5 hover:bg-slate-50">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600"><UserX size={18} /></span>
            <div><p className="text-2xl font-black text-slate-900">{attention?.inactiveAccounts ?? 0}</p><p className="text-xs font-semibold text-slate-500">Inactive accounts</p></div>
            <ChevronRight className="ml-auto text-slate-300 group-hover:text-slate-600" size={18} />
          </Link>
          <Link to="/activity-logs" className="group flex items-center gap-3 p-5 hover:bg-slate-50">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><CircleAlert size={18} /></span>
            <div><p className="text-2xl font-black text-slate-900">{attention?.securityEventsToday ?? 0}</p><p className="text-xs font-semibold text-slate-500">Security events today</p></div>
            <ChevronRight className="ml-auto text-slate-300 group-hover:text-slate-600" size={18} />
          </Link>
          <Link to="/users" className="group flex items-center gap-3 p-5 hover:bg-slate-50">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><MailWarning size={18} /></span>
            <div><p className="text-2xl font-black text-slate-900">{attention?.pendingEmailChanges ?? 0}</p><p className="text-xs font-semibold text-slate-500">Pending email changes</p></div>
            <ChevronRight className="ml-auto text-slate-300 group-hover:text-slate-600" size={18} />
          </Link>
        </div>
        {(attention?.recentSecurityEvents?.length ?? 0) > 0 && (
          <div className="border-t border-slate-100 px-5 py-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Latest security events</p>
            <div className="grid gap-2 lg:grid-cols-2">
              {attention.recentSecurityEvents.slice(0, 4).map((event) => (
                <Link key={event._id} to="/activity-logs" className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-2.5 hover:border-red-100 hover:bg-red-50/50">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{ACTION_LABELS[event.action] || event.action}</p><p className="truncate text-xs text-slate-400">{event.actorUsername || event.details || "Unknown account"}</p></div>
                  <time className="shrink-0 text-[10px] font-semibold text-slate-400">{new Date(event.createdAt).toLocaleDateString()}</time>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-3">
          <div className="flex items-start justify-between">
            <div><h2 className="font-extrabold text-slate-900">System activity</h2><p className="mt-1 text-xs text-slate-400">Audit and security events over the last 7 days</p></div>
            <Link to="/activity-logs" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900">All logs <ChevronRight size={14} /></Link>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminSummary?.activityTrend ?? []} margin={{ left: -24, right: 4 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={{ border: 0, borderRadius: 16, boxShadow: "0 12px 30px rgb(15 23 42 / .12)" }} />
                <Bar dataKey="activity" name="All activity" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={34} />
                <Bar dataKey="security" name="Security" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
          <div><h2 className="font-extrabold text-slate-900">Accounts by role</h2><p className="mt-1 text-xs text-slate-400">{roleTotal} registered accounts</p></div>
          <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roles.length ? roles : [{ role: "No users", count: 1 }]} dataKey="count" nameKey="role" innerRadius={52} outerRadius={78} stroke="none">
                    {(roles.length ? roles : [{ role: "No users" }]).map((entry, index) => <Cell key={entry.role} fill={roles.length ? ROLE_COLORS[index % ROLE_COLORS.length] : "#e2e8f0"} />)}
                  </Pie>
                  {roles.length > 0 && <Tooltip />}
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-2xl font-black text-slate-900">{roleTotal}</p><p className="text-[10px] font-bold uppercase text-slate-400">Users</p></div></div>
            </div>
            <div className="w-full space-y-2">
              {roles.map((item, index) => (
                <div key={item.role} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-500"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ROLE_COLORS[index % ROLE_COLORS.length] }} /><span className="truncate">{item.role}</span></span>
                  <span className="font-extrabold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div><h2 className="font-extrabold text-slate-900">Recent activity</h2><p className="mt-1 text-xs text-slate-400">Latest account and system events</p></div>
            <Link to="/activity-logs" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">View audit log</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-8 text-center text-sm text-slate-400">Loading admin dashboard...</p>}
            {!loading && (adminSummary?.recentActivity?.length ?? 0) === 0 && <p className="p-8 text-center text-sm text-slate-400">No activity recorded yet.</p>}
            {adminSummary?.recentActivity?.map((log) => (
              <div key={log._id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700"><strong className="text-slate-950">{actorName(log)}</strong> {ACTION_LABELS[log.action]?.toLowerCase() || log.action.toLowerCase().replaceAll("_", " ")}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{log.details || log.actor?.role || "System activity"}</p>
                </div>
                <time className="shrink-0 text-[11px] font-medium text-slate-400">{new Date(log.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-[26rem] overflow-hidden rounded-3xl">
            <OnlineUsersCard />
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-extrabold text-slate-900">Admin actions</h2>
            <p className="mt-1 text-xs text-slate-400">Common management tasks</p>
            <div className="mt-4 space-y-2">
              <Link to="/users" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:border-emerald-200 hover:bg-emerald-50">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><UserPlus size={18} /></span>
                <span><strong className="block text-sm text-slate-900">Manage users</strong><small className="text-xs text-slate-400">Create, activate, or reset accounts</small></span>
                <ChevronRight className="ml-auto text-slate-300" size={17} />
              </Link>
              <Link to="/alerts" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:border-amber-200 hover:bg-amber-50">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700"><BellRing size={18} /></span>
                <span><strong className="block text-sm text-slate-900">Patient alerts</strong><small className="text-xs text-slate-400">{stats?.alertsThisWeek ?? 0} sent in the last 7 days</small></span>
                <ChevronRight className="ml-auto text-slate-300" size={17} />
              </Link>
              <Link to="/activity-logs" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:border-blue-200 hover:bg-blue-50">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700"><ShieldCheck size={18} /></span>
                <span><strong className="block text-sm text-slate-900">Review audit trail</strong><small className="text-xs text-slate-400">Investigate account activity</small></span>
                <ChevronRight className="ml-auto text-slate-300" size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
