import { useEffect, useState } from "react";
import {
  Activity,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  MailWarning,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import OnlineUsersCard from "../components/dashboard/OnlineUsersCard";
import Topbar from "../components/layout/Topbar";
import { useAuthStore } from "../store/authStore";
import { useDashboardStore } from "../store/dashboardStore";
import { useMessageStore } from "../store/messageStore";

const COLORS = ["#1f4d3d", "#22a06b", "#3b82f6", "#8b5cf6", "#f59e0b"];
const LABELS = {
  USER_LOGIN: "Signed in",
  USER_LOGOUT: "Signed out",
  LOGIN_FAILED: "Failed sign-in",
  LOGIN_BLOCKED: "Blocked sign-in",
  USER_STATUS_CHANGED: "Changed account status",
  USER_PASSWORD_CHANGED: "Reset a password",
  USER_CREATED: "Created a user",
  ACCOUNT_PROFILE_UPDATED: "Updated profile",
  ACCOUNT_PASSWORD_CHANGED: "Changed password",
  PASSWORD_CHANGE_FAILED: "Password change failed",
  ANNOUNCEMENT_CREATED: "Published an announcement",
  ANNOUNCEMENT_UPDATED: "Updated an announcement",
  ANNOUNCEMENT_DELETED: "Deleted an announcement",
};

const actor = (log) => log.actor?.name || log.actor?.username || log.actorUsername || "System";
const when = (date) => date
  ? new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
  : "—";

const CardHeading = ({ title, subtitle, action }) => (
  <div className="flex min-w-0 items-start justify-between gap-2">
    <div className="min-w-0">
      <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 truncate text-[9px] text-slate-400">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

const AdminMetric = ({ to, icon: Icon, label, value, footer, iconClass, footerClass = "text-emerald-600" }) => (
  <Link to={to} className="flex h-full min-h-[84px] min-w-0 flex-col justify-center bg-white px-3 py-2 transition hover:bg-slate-50">
    <span className="flex items-center gap-2">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${iconClass}`}><Icon size={14} /></span>
      <strong className="text-base leading-none text-slate-900">{value ?? "—"}</strong>
    </span>
    <span className="mt-1.5 line-clamp-2 h-5 text-[9px] font-semibold leading-[10px] text-slate-500">{label}</span>
    <span className={`mt-1 flex h-2.5 items-center truncate text-[8px] font-bold leading-none ${footerClass}`}>{footer}</span>
  </Link>
);

const QueueItem = ({ to, label, value, urgent }) => (
  <Link to={to} className="flex items-center justify-between gap-2 py-1.5 hover:text-emerald-700">
    <span className="truncate text-[9px] font-medium text-slate-500">{label}</span>
    <strong className={`rounded-full px-2 py-0.5 text-[9px] ${urgent ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700"}`}>{value ?? 0}</strong>
  </Link>
);

const AdminDashboardCompact = () => {
  const [accountPeriod, setAccountPeriod] = useState("all");
  const [activityPeriod, setActivityPeriod] = useState("week");
  const user = useAuthStore((state) => state.user);
  const conversations = useMessageStore((state) => state.conversations);
  const { adminSummary, loading, error, fetchAdminSummary } = useDashboardStore();

  useEffect(() => { fetchAdminSummary({ accountPeriod, activityPeriod }); }, [accountPeriod, activityPeriod, fetchAdminSummary]);

  const stats = adminSummary?.stats;
  const roles = adminSummary?.usersByRole ?? [];
  const roleTotal = roles.reduce((sum, row) => sum + row.count, 0);
  const activeRate = stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const attention = adminSummary?.needsAttention;
  const accountChanges = (adminSummary?.recentActivity ?? []).filter((log) => log.action?.includes("PASSWORD") || log.action?.includes("ACCOUNT")).length;
  const attentionItems = [
    { label: "Inactive accounts", value: attention?.inactiveAccounts ?? 0, icon: UserX, to: "/users", tone: "bg-rose-50 text-rose-600" },
    { label: "Security events today", value: attention?.securityEventsToday ?? 0, icon: ShieldAlert, to: "/activity-logs", tone: "bg-amber-50 text-amber-700" },
    { label: "Pending email changes", value: attention?.pendingEmailChanges ?? 0, icon: MailWarning, to: "/users", tone: "bg-blue-50 text-blue-600" },
    { label: "New accounts this week", value: stats?.newUsersThisWeek ?? 0, icon: UserCheck, to: "/users", tone: "bg-emerald-50 text-emerald-700" },
    { label: "Alerts this week", value: stats?.alertsThisWeek ?? 0, icon: BellRing, to: "/alerts", tone: "bg-violet-50 text-violet-700" },
    { label: "Recent account changes", value: accountChanges, icon: Activity, to: "/activity-logs", tone: "bg-cyan-50 text-cyan-700" },
  ];
  const recentActions = (adminSummary?.recentActivity ?? []).slice(0, 15);
  const recentSecurity = attention?.recentSecurityEvents ?? [];
  const activityTrend = adminSummary?.activityTrend ?? [];
  const weeklyActivity = activityTrend.reduce((sum, row) => sum + (row.activity ?? 0), 0);
  const activeDays = activityTrend.filter((row) => (row.activity ?? 0) > 0).length;
  const busiestDay = activityTrend.reduce((best, row) => (row.activity ?? 0) > (best?.activity ?? 0) ? row : best, null);

  return (
    <div className="admin-dashboard-readable space-y-2.5 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:overflow-hidden">
      <Topbar title="Admin workspace" />

      {error && <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><CircleAlert size={14} />{error}</div>}

      <div className="grid w-full grid-cols-1 items-stretch gap-2.5 xl:mt-2.5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(680px,1fr)_270px_215px]">
        <div className="h-full space-y-2.5 xl:grid xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] xl:space-y-0 xl:gap-2.5">
          <div className="grid min-h-[86px] w-full grid-cols-1 items-stretch gap-2.5 md:grid-cols-[minmax(220px,.72fr)_minmax(0,1.58fr)]" aria-label="Administration overview and account totals">
            <section className="relative h-full min-h-[86px] w-full overflow-hidden rounded-xl bg-[#173d31] p-3 text-white shadow-sm">
              <div className="absolute -right-10 -top-20 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative flex h-full items-center">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-200"><Sparkles size={11} />Administration overview</p>
                  <h1 className="mt-1.5 truncate text-base font-black">Good day, {user?.name || user?.username || "Administrator"}.</h1>
                </div>
              </div>
            </section>

            <section className="grid h-full min-h-[86px] min-w-0 grid-cols-2 items-stretch divide-x divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0" aria-label="Administrator totals">
              <AdminMetric to="/users" icon={Users} label="Total accounts" value={stats?.totalUsers} footer={`↗ ${stats?.newUsersThisWeek ?? 0} new this week`} iconClass="bg-slate-100 text-slate-600" />
              <AdminMetric to="/users" icon={UserCheck} label="Active accounts" value={stats?.activeUsers} footer={`↗ ${activeRate}% active`} iconClass="bg-emerald-50 text-emerald-600" />
              <AdminMetric to="/activity-logs" icon={Activity} label="Activity today" value={stats?.activityToday} footer="↗ Audit events" iconClass="bg-indigo-50 text-indigo-600" />
              <AdminMetric to="/activity-logs" icon={ShieldAlert} label="Security events" value={stats?.failedLoginsToday} footer="Review recommended" iconClass="bg-rose-50 text-rose-600" footerClass="text-emerald-600" />
            </section>
          </div>

          <div className="grid min-h-0 w-full grid-cols-1 items-stretch gap-2.5 overflow-hidden lg:grid-cols-[minmax(400px,1fr)_240px]">
            <section className="flex h-full min-h-[210px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
              <CardHeading title="System activity" subtitle={`Audit and security events · ${activityPeriod === "all" ? "All history" : activityPeriod}`} action={(
                <select value={activityPeriod} onChange={(event) => setActivityPeriod(event.target.value)} className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 outline-none focus:border-emerald-400" aria-label="System activity period">
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="all">All history</option>
                </select>
              )} />
              <div className="mt-1.5 h-32 min-w-0 pb-1 xl:h-auto xl:min-h-0 xl:flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityTrend} margin={{ top: 8, right: 12, left: -14, bottom: 14 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} interval={0} height={30} tickMargin={8} tick={{ fill: "#64748b", fontSize: 8, fontWeight: 600 }} />
                    <YAxis width={22} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ border: "0", borderRadius: "16px", boxShadow: "0 10px 30px rgb(15 23 42 / 0.12)" }} />
                    <Bar dataKey="activity" fill="#1f4d3d" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="security" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-2 text-center">
                <div><b className="text-xs text-slate-900">{activityTrend.length ? (weeklyActivity / activityTrend.length).toFixed(1) : "0.0"}</b><p className="text-[7px] uppercase text-slate-400">Avg / day</p></div>
                <div><b className="text-xs text-blue-600">{busiestDay?.day ?? "—"}</b><p className="text-[7px] uppercase text-slate-400">Busiest · {busiestDay?.activity ?? 0}</p></div>
                <div><b className="text-xs text-emerald-700">{activeDays}/{activityTrend.length || 0}</b><p className="text-[7px] uppercase text-slate-400">Active periods</p></div>
              </div>
            </section>

            <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-sm">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0"><h2 className="text-sm font-bold text-slate-900">Account overview</h2><p className="mt-1 text-[9px] text-slate-400">Account mix by role</p></div>
                <select value={accountPeriod} onChange={(event) => setAccountPeriod(event.target.value)} className="h-7 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 outline-none focus:border-emerald-400" aria-label="Account overview period">
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="all">All history</option>
                </select>
              </div>
              <div className="mt-1.5 flex min-h-0 flex-1 flex-col border-t border-slate-100 pt-1.5">
                <div className="relative mx-auto h-24 w-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={roles.length ? roles : [{ role: "None", count: 1 }]} dataKey="count" innerRadius={30} outerRadius={44} paddingAngle={3} stroke="none">{roles.map((row, index) => <Cell key={row.role} fill={COLORS[index % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer>
                  <div className="absolute inset-0 grid place-items-center text-center"><div><b className="text-base">{roleTotal}</b><p className="text-[7px] text-slate-400">USERS</p></div></div>
                </div>
                <div className="mt-1 grid min-h-0 min-w-0 flex-1 grid-cols-2 grid-rows-2 gap-1">
                  {roles.slice(0, 4).map((row, index) => <div key={row.role} className="flex min-h-0 min-w-0 flex-col justify-center rounded-md bg-slate-50 px-1.5 py-1"><span className="flex min-w-0 items-center gap-1 text-[8px]"><i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} /><span className="truncate capitalize text-slate-500">{row.role.toLowerCase().replaceAll("_", " ")}</span></span><div className="mt-0.5 flex items-end justify-between"><b className="text-xs leading-none text-slate-900">{row.count}</b><small className="text-[7px] text-slate-400">{roleTotal ? Math.round((row.count / roleTotal) * 100) : 0}%</small></div></div>)}
                </div>
              </div>
            </section>
          </div>

          <div className="grid min-h-0 w-full grid-cols-1 items-stretch gap-2.5 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
              <CardHeading title="Recent audit activity" subtitle="Latest account and system changes" action={<Link to="/activity-logs" className="text-[9px] font-bold text-emerald-700">View all</Link>} />
              <div className="audit-activity-scroll mt-2 min-h-0 flex-1 overflow-y-auto">
                {loading && !adminSummary && <p className="py-4 text-center text-[10px] text-slate-400">Loading…</p>}
                {!loading && !recentActions.length && <div className="grid h-full place-items-center text-slate-300"><CheckCircle2 size={18} /></div>}
                <div className="divide-y divide-slate-100">
                  {recentActions.map((log) => (
                    <div key={log._id} className="flex min-w-0 items-center gap-2 py-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <div className="min-w-0 flex-1"><p className="truncate text-[10px] text-slate-600"><strong>{actor(log)}</strong> {(LABELS[log.action] || log.action)?.toLowerCase()}</p><p className="truncate text-[8px] text-slate-400">{log.details || "System activity"}</p></div>
                      <time className="shrink-0 text-[8px] text-slate-400">{when(log.createdAt)}</time>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
              <CardHeading title="Needs attention" subtitle="Items awaiting administrator review" />
              <div className="mt-2 min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {attentionItems.map(({ label, value, icon: Icon, to, tone }) => (
                  <Link key={label} to={to} className="flex items-center gap-2 py-2 hover:bg-slate-50">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={13} /></span>
                    <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-slate-500">{label}</span>
                    <strong className="text-xs text-slate-900">{value}</strong><ChevronRight size={11} className="text-slate-300" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden">
          <div className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2.5">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <CardHeading title="Security Overview" subtitle="Authentication and account risk" />
              <div className="mt-1 min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <QueueItem to="/activity-logs" label="Failed logins today" value={stats?.failedLoginsToday} urgent={(stats?.failedLoginsToday ?? 0) > 0} />
                <QueueItem to="/activity-logs" label="Recent security events" value={recentSecurity.length} urgent={recentSecurity.length > 0} />
                <QueueItem to="/activity-logs" label="Recent account changes" value={accountChanges} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <CardHeading title="Recent messages" subtitle="Latest conversations" action={<Link to="/messages" className="text-[8px] font-bold text-emerald-700">View all</Link>} />
              <div className="mt-1 divide-y divide-slate-100">
                {conversations.slice(0, 10).map((conversation) => {
                  const message = conversation.lastMessage;
                  const senderName = message?.sender?.name || message?.sender?.username || conversation.name || "Conversation";
                  const preview = message?.isUnsent ? "Message unsent" : message?.text || (message?.attachment?.kind ? `${message.attachment.kind} attachment` : "New message");
                  return (
                    <Link key={conversation._id} to="/messages" className="flex min-w-0 items-center gap-2 py-1.5 hover:bg-slate-50">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><MailWarning size={13} /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[9px] font-semibold text-slate-700">{senderName}</span><span className="block truncate text-[8px] text-slate-400">{preview}</span></span>
                      <span className="shrink-0 text-right">{conversation.unreadCount > 0 && <b className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[7px] text-white">{conversation.unreadCount}</b>}<time className="mt-0.5 block text-[7px] text-slate-400">{when(conversation.lastMessageAt)}</time></span>
                    </Link>
                  );
                })}
                {!conversations.length && <p className="py-4 text-center text-[9px] text-slate-400">No recent messages</p>}
              </div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <CardHeading title="Recent alerts" subtitle="Latest patient notifications" action={<Link to="/alerts" className="text-[8px] font-bold text-emerald-700">View all</Link>} />
              <div className="mt-1.5 min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(adminSummary?.recentAlerts ?? []).slice(0, 7).map((alert) => (
                  <Link key={alert._id} to="/alerts" className="flex min-w-0 items-center gap-2 py-1.5 hover:bg-slate-50">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><BellRing size={12} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[9px] font-semibold text-slate-600">{alert.title}</span><time className="block truncate text-[7px] text-slate-400">{alert.type} · {when(alert.createdAt)}</time></span>
                    <ChevronRight size={11} className="shrink-0 text-slate-300" />
                  </Link>
                ))}
                {!loading && !(adminSummary?.recentAlerts?.length) && <p className="py-3 text-center text-[9px] text-slate-400">No recent alerts</p>}
              </div>
            </section>
          </div>
        </div>

        <aside className="h-full min-w-0 overflow-hidden">
          <OnlineUsersCard tall />
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboardCompact;
