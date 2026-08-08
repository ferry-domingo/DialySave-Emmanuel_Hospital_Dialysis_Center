import { useEffect } from "react";
import { Activity, ArrowUpRight, CheckCircle2, ChevronRight, CircleAlert, Clock3, MailWarning, ShieldAlert, ShieldCheck, Sparkles, UserCheck, UserX, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Topbar from "../components/layout/Topbar";
import { useAuthStore } from "../store/authStore";
import { useDashboardStore } from "../store/dashboardStore";

const COLORS = ["#1f4d3d", "#22a06b", "#3b82f6", "#8b5cf6", "#f59e0b"];
const LABELS = { USER_LOGIN: "Signed in", USER_LOGOUT: "Signed out", LOGIN_FAILED: "Failed sign-in", LOGIN_BLOCKED: "Blocked sign-in", USER_STATUS_CHANGED: "Changed account status", USER_PASSWORD_CHANGED: "Reset a password", USER_CREATED: "Created a user", ACCOUNT_PROFILE_UPDATED: "Updated profile", ACCOUNT_PASSWORD_CHANGED: "Changed password", PASSWORD_CHANGE_FAILED: "Password change failed" };
const actor = (log) => log.actor?.name || log.actor?.username || log.actorUsername || "System";
const when = (date) => date ? new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

const Metric = ({ icon: Icon, label, value, note, tone }) => <div className="flex min-w-0 flex-col justify-center px-2.5 py-2"><div className="flex items-center gap-2"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={14} /></span><strong className="text-base leading-none text-slate-950">{value ?? "—"}</strong></div><p className="mt-1.5 line-clamp-2 h-5 text-[9px] font-semibold leading-[10px] text-slate-500">{label}</p><p className="mt-1 flex items-center gap-0.5 truncate text-[7px] font-bold text-emerald-600"><ArrowUpRight size={8} />{note}</p></div>;
const Header = ({ title, subtitle, action }) => <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2"><div className="min-w-0"><h2 className="truncate text-xs font-extrabold text-slate-950">{title}</h2><p className="truncate text-[8px] text-slate-400">{subtitle}</p></div>{action}</div>;

const AdminDashboardCompact = () => {
  const user = useAuthStore((state) => state.user);
  const { adminSummary, loading, error, fetchAdminSummary } = useDashboardStore();
  useEffect(() => { fetchAdminSummary(); }, [fetchAdminSummary]);

  const stats = adminSummary?.stats;
  const roles = adminSummary?.usersByRole ?? [];
  const roleTotal = roles.reduce((sum, row) => sum + row.count, 0);
  const activeRate = stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const attention = adminSummary?.needsAttention;
  const items = [
    { label: "Inactive accounts", value: attention?.inactiveAccounts ?? 0, icon: UserX, to: "/users", tone: "bg-rose-50 text-rose-600" },
    { label: "Security events today", value: attention?.securityEventsToday ?? 0, icon: ShieldAlert, to: "/activity-logs", tone: "bg-amber-50 text-amber-700" },
    { label: "Pending email changes", value: attention?.pendingEmailChanges ?? 0, icon: MailWarning, to: "/users", tone: "bg-blue-50 text-blue-600" },
  ];
  const attentionTotal = items.reduce((sum, row) => sum + row.value, 0);

  return <div className="space-y-2.5 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:overflow-hidden">
    <Topbar title="Admin workspace" />
    {error && <div className="absolute right-5 top-14 z-30 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><CircleAlert size={14} />{error}</div>}

    <div className="grid min-h-0 gap-2.5 xl:mt-2.5 xl:w-1/2 xl:grid-rows-[86px_196px_238px]">
      <section className="grid min-h-0 grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl bg-[#173d31] p-3 text-white shadow-sm"><div className="absolute -right-10 -top-20 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" /><div className="relative flex h-full items-center"><div className="min-w-0"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-200"><Sparkles size={11} />Administration overview</p><h1 className="mt-1.5 truncate text-base font-black">Good day, {user?.name || user?.username || "Administrator"}.</h1><p className="mt-1 truncate text-[9px] text-emerald-50/70">System health and security at a glance.</p></div></div></div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="grid h-full grid-cols-4 divide-x divide-slate-100"><Metric icon={Users} label="Total accounts" value={stats?.totalUsers} note={`${stats?.newUsersThisWeek ?? 0} new this week`} tone="bg-slate-100 text-slate-700" /><Metric icon={UserCheck} label="Active accounts" value={stats?.activeUsers} note={`${activeRate}% active`} tone="bg-emerald-50 text-emerald-700" /><Metric icon={Activity} label="Activity today" value={stats?.activityToday} note="Audit events" tone="bg-blue-50 text-blue-700" /><Metric icon={ShieldCheck} label="Security events" value={stats?.failedLoginsToday} note="Review recommended" tone="bg-rose-50 text-rose-600" /></div></div>
      </section>

      <section className="grid min-h-0 grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1.15fr)_minmax(220px,.85fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><Header title="7-day system activity" subtitle="Audit events and security exceptions" action={<div className="flex gap-2 text-[7px] text-slate-500"><span>● Activity</span><span className="text-rose-500">● Security</span></div>} /><div className="min-h-0 flex-1 p-1.5"><ResponsiveContainer width="100%" height="100%"><BarChart data={adminSummary?.activityTrend ?? []} margin={{ left: -22, right: 6 }}><CartesianGrid stroke="#edf2ef" strokeDasharray="4 5" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} /><Tooltip /><Bar dataKey="activity" fill="#1f4d3d" radius={[4, 4, 0, 0]} maxBarSize={24} /><Bar dataKey="security" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={10} /></BarChart></ResponsiveContainer></div></div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><Header title="Account distribution" subtitle={`${roleTotal} accounts across roles`} /><div className="flex min-h-0 flex-1 items-center gap-2 p-2"><div className="relative h-20 w-20 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={roles.length ? roles : [{ role: "None", count: 1 }]} dataKey="count" innerRadius={25} outerRadius={36} paddingAngle={3} stroke="none">{roles.map((row, index) => <Cell key={row.role} fill={COLORS[index % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 grid place-items-center text-center"><div><b>{roleTotal}</b><p className="text-[6px] text-slate-400">USERS</p></div></div></div><div className="w-full space-y-1.5">{roles.map((row, index) => <div key={row.role} className="flex justify-between gap-1 text-[9px]"><span className="flex min-w-0 items-center gap-1"><i className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} /><span className="truncate capitalize">{row.role.toLowerCase().replaceAll("_", " ")}</span></span><b>{row.count}</b></div>)}</div></div></div>
      </section>

      <section className="grid min-h-0 grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(180px,.6fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><Header title="Recent activity" subtitle="Latest account and system events" action={<Link to="/activity-logs" className="flex text-[8px] font-bold text-emerald-700">View all <ChevronRight size={10} /></Link>} /><div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-hidden">{loading && !adminSummary && <p className="p-8 text-center text-xs text-slate-400">Loading…</p>}{!loading && !adminSummary?.recentActivity?.length && <div className="grid h-full place-items-center text-slate-400"><CheckCircle2 size={18} /></div>}{adminSummary?.recentActivity?.slice(0, 5).map((log) => <div key={log._id} className="flex items-center gap-2 px-3 py-1.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Activity size={10} /></span><div className="min-w-0 flex-1"><p className="truncate text-[9px] text-slate-600"><strong>{actor(log)}</strong> {(LABELS[log.action] || log.action)?.toLowerCase()}</p><p className="truncate text-[7px] text-slate-400">{log.details || "System activity"}</p></div><time className="flex shrink-0 items-center gap-1 text-[7px] text-slate-400"><Clock3 size={8} />{when(log.createdAt)}</time></div>)}</div></div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><Header title="Needs attention" subtitle="Awaiting administrator review" action={<b className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] text-amber-700">{attentionTotal}</b>} /><div className="min-h-0 flex-1 divide-y divide-slate-100">{items.map(({ label, value, icon: Icon, to, tone }) => <Link key={label} to={to} className="flex h-1/3 items-center gap-2.5 px-3 hover:bg-slate-50"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={12} /></span><span className="min-w-0 flex-1 truncate text-[9px] font-medium text-slate-600">{label}</span><b className="text-[11px] text-slate-900">{value}</b><ChevronRight size={11} className="text-slate-300" /></Link>)}</div></div>
      </section>
    </div>
  </div>;
};

export default AdminDashboardCompact;
