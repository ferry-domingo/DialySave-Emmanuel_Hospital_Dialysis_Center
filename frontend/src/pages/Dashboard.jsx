import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Stethoscope, Users } from "lucide-react";

import Topbar from "../components/layout/Topbar";
import StatCard from "../components/dashboard/StatCard";
import RecentSessionsCard from "../components/dashboard/RecentSessionsCard";
import QuickPatientForm from "../components/dashboard/QuickPatientForm";
import OnlineUsersCard from "../components/dashboard/OnlineUsersCard";
import SessionTrendsChart from "../components/dashboard/SessionTrendsChart";
import SessionOverviewChart from "../components/dashboard/SessionOverviewChart";

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

  return (
    <>
      <Topbar title={isAdmin ? "Admin Dashboard" : "Dashboard"} />

      {isAdmin && (
        <div className="mb-4 overflow-hidden rounded-3xl bg-slate-950 px-6 py-5 text-white shadow-sm">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Patients"
          unit="patients"
          value={stats ? stats.patients.total : "—"}
          icon={Users}
          iconClass="bg-emerald-50 text-emerald-600"
          periodDays={stats ? stats.patients.periodDays : 7}
          changePercent={stats ? stats.patients.changePercent : 0}
          detailsHref={isAdmin ? undefined : "/patients"}
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
        />
        <StatCard
          label={isAdmin ? "Registered Users" : "Total Staff"}
          unit={isAdmin ? "accounts" : "Staff"}
          value={stats ? (isAdmin ? stats.users?.total : stats.doctors.total) : "—"}
          icon={Stethoscope}
          iconClass="bg-violet-50 text-violet-600"
          periodDays={stats ? (isAdmin ? stats.users?.periodDays : stats.doctors.periodDays) : 30}
          changePercent={stats ? (isAdmin ? stats.users?.changePercent : stats.doctors.changePercent) : 0}
          detailsHref={isAdmin ? "/users" : "/doctors"}
        />
      </div>

      <div className={`mt-4 grid grid-cols-1 gap-4 ${isAdmin ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
        <RecentSessionsCard sessions={summary?.recentSessions ?? []} loading={loading} showLink={!isAdmin} />
        {!isAdmin && <QuickPatientForm />}
        <OnlineUsersCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SessionTrendsChart data={summary?.sessionTrends ?? []} />
        <SessionOverviewChart
          today={summary?.sessionOverview?.today ?? 0}
          byPaymentType={summary?.sessionOverview?.byPaymentType ?? {}}
        />
      </div>
    </>
  );
};

export default Dashboard;
