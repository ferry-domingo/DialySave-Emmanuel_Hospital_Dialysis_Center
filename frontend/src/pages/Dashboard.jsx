import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Banknote, CreditCard, Stethoscope, Users } from "lucide-react";

import Topbar from "../components/layout/Topbar";
import StatCard from "../components/dashboard/StatCard";
import RecentSessionsCard from "../components/dashboard/RecentSessionsCard";
import QuickPatientForm from "../components/dashboard/QuickPatientForm";
import OnlineUsersCard from "../components/dashboard/OnlineUsersCard";
import SessionTrendsChart from "../components/dashboard/SessionTrendsChart";
import SessionOverviewChart from "../components/dashboard/SessionOverviewChart";
import PhilHealthActionPanel from "../components/dashboard/PhilHealthActionPanel";

import { useAuthStore } from "../store/authStore";
import { useDashboardStore } from "../store/dashboardStore";
import { normalizeRole, ROLES } from "../utils/roles";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { summary, loading, fetchSummary } = useDashboardStore();
  const role = normalizeRole(user?.role);
  const isAdmin = role === ROLES.ADMIN;

  useEffect(() => {
    if (role === ROLES.PATIENT) {
      navigate("/patient-portal", { replace: true });
    }
  }, [navigate, role]);

  useEffect(() => {
    if (user && role !== ROLES.PATIENT) fetchSummary();
  }, [user, role, fetchSummary]);

  if (role === ROLES.PATIENT) return null;

  const stats = summary?.stats;
  const snapshot = summary?.operationalSnapshot;
  const monitoringItems = [
    { label: "Active patients", value: snapshot?.activePatients, icon: Users, tone: "bg-emerald-50 text-emerald-700", to: "/patients" },
    { label: "Active doctors", value: snapshot?.activeDoctors, icon: Stethoscope, tone: "bg-violet-50 text-violet-700", to: "/doctors" },
    { label: "Sessions today", value: snapshot?.sessionsToday, icon: Activity, tone: "bg-cyan-50 text-cyan-700", to: "/sessions" },
  ];

  return (
    <div className="space-y-2.5 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:overflow-hidden">
      <Topbar title={isAdmin ? "Admin Dashboard" : "Dashboard"} />

      <div className="grid w-full grid-cols-1 items-stretch gap-2.5 xl:mt-2.5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(680px,1fr)_270px_215px]">
      <div className="h-full space-y-2.5 xl:grid xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] xl:space-y-0 xl:gap-2.5">

      {isAdmin && (
        <div className="overflow-hidden rounded-xl bg-slate-950 px-4 py-3 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">System overview</p>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-extrabold">Welcome back, {user?.name || user?.username || "Administrator"}</h1>
              <p className="mt-1 text-sm text-slate-300">Monitor patient activity, dialysis operations, staff, and connected users.</p>
            </div>
            <span className="w-fit rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
              Updated {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="h-full min-h-[78px] w-full overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm" aria-label="Dashboard totals">
        <div className="grid h-full grid-cols-2 divide-x divide-slate-100 sm:grid-cols-5">
        <StatCard
          label="Total Patients"
          unit="patients"
          value={stats ? stats.patients.total : "—"}
          icon={Users}
          iconClass="bg-emerald-50 text-emerald-600"
          periodDays={stats ? stats.patients.periodDays : 7}
          changePercent={stats ? stats.patients.changePercent : 0}
          detailsHref={isAdmin ? undefined : "/patients"}
          micro
        />
        <StatCard
          label={isAdmin ? "Registered Users" : "Total Doctors"}
          unit={isAdmin ? "accounts" : "Doctors"}
          value={stats ? (isAdmin ? stats.users?.total : stats.doctors.total) : "—"}
          icon={Stethoscope}
          iconClass="bg-violet-50 text-violet-600"
          periodDays={stats ? (isAdmin ? stats.users?.periodDays : stats.doctors.periodDays) : 30}
          changePercent={stats ? (isAdmin ? stats.users?.changePercent : stats.doctors.changePercent) : 0}
          detailsHref={isAdmin ? "/users" : "/doctors"}
          micro
        />
        <StatCard
          label="Total Dialysis Sessions"
          unit="Dialysis Sessions"
          value={stats ? stats.sessions.total : "—"}
          icon={Activity}
          iconClass="bg-cyan-50 text-cyan-600"
          periodDays={stats ? stats.sessions.periodDays : 30}
          changePercent={stats ? stats.sessions.changePercent : 0}
          detailsHref={isAdmin ? undefined : "/sessions"}
          micro
        />
        <StatCard
          label="Total PHIC Sessions"
          unit="PHIC sessions"
          value={summary?.sessionPaymentStats?.PHIC?.total ?? "—"}
          icon={CreditCard}
          iconClass="bg-blue-50 text-blue-600"
          periodDays={summary?.sessionPaymentStats?.PHIC?.periodDays ?? 30}
          changePercent={summary?.sessionPaymentStats?.PHIC?.changePercent ?? 0}
          detailsHref="/sessions"
          micro
        />
        <StatCard
          label="Total Cash Sessions"
          unit="Cash sessions"
          value={summary?.sessionPaymentStats?.CASH?.total ?? "—"}
          icon={Banknote}
          iconClass="bg-amber-50 text-amber-600"
          periodDays={summary?.sessionPaymentStats?.CASH?.periodDays ?? 30}
          changePercent={summary?.sessionPaymentStats?.CASH?.changePercent ?? 0}
          detailsHref="/sessions"
          micro
        />
        </div>
      </section>

      {!isAdmin && (
        <section className="h-full min-h-[78px] w-full overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm" aria-label="Center monitoring">
          <div className="grid h-full grid-cols-3 divide-x divide-slate-100">
            {monitoringItems.map(({ label, value, icon: Icon, tone, to }) => (
              <Link key={label} to={to} title={`${label}: ${value ?? "—"}`} className="flex min-w-0 flex-col justify-center px-3 py-2.5 transition hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={14} /></span>
                  <strong className="text-base leading-none text-slate-900">{value ?? "—"}</strong>
                </span>
                <small className="mt-1.5 block truncate text-[9px] font-semibold leading-none text-slate-500">{label}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
      </div>

      <div className={`grid min-h-0 w-full grid-cols-1 items-stretch gap-2.5 overflow-hidden ${isAdmin ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(320px,1fr)_340px]"}`}>
        <RecentSessionsCard sessions={summary?.recentSessions ?? []} loading={loading} showLink={!isAdmin} />
        {!isAdmin && <QuickPatientForm />}
      </div>

      <div className="grid min-h-0 w-full grid-cols-1 items-stretch gap-2.5 overflow-hidden lg:grid-cols-[minmax(400px,1fr)_240px]">
        <SessionTrendsChart data={summary?.sessionTrends ?? []} periods={summary?.sessionAnalytics} />
        <SessionOverviewChart
          today={summary?.sessionOverview?.today ?? 0}
          byPaymentType={summary?.sessionOverview?.byPaymentType ?? {}}
          periods={summary?.sessionAnalytics}
        />
      </div>
      </div>

      {!isAdmin && (
        <div className="min-h-0 overflow-hidden"><PhilHealthActionPanel data={summary?.philHealthSnapshot} operations={snapshot} /></div>
      )}

      <aside className="h-full min-w-0 overflow-hidden">
        <OnlineUsersCard tall />
      </aside>
      </div>
    </div>
  );
};

export default Dashboard;
