import { useEffect } from "react";
import { AlertCircle, CalendarDays, CircleDollarSign, ClipboardCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Topbar from "../components/layout/Topbar";
import { useAuthStore } from "../store/authStore";
import { useDashboardStore } from "../store/dashboardStore";

const Metric = ({ icon: Icon, label, value, note, tone }) => (
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

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const CashierDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const { cashierSummary, loading, error, fetchCashierSummary } = useDashboardStore();

  useEffect(() => { fetchCashierSummary(); }, [fetchCashierSummary]);

  const stats = cashierSummary?.stats;
  const recent = cashierSummary?.recentCashSessions ?? [];

  return (
    <div className="space-y-5">
      <Topbar title="Cashier Dashboard" />

      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-12 -top-20 h-60 w-60 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-amber-300">
              <CircleDollarSign size={14} /> Cash treatment workspace
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Good day, {user?.name || user?.username || "Cashier"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Review cash dialysis sessions and complete treatment reasons using the records already in the system.
            </p>
          </div>
          <Link to="/monitoring" className="w-fit rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-300">
            Open cash monitoring
          </Link>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CalendarDays} label="Cash sessions today" value={stats?.cashToday} note="Cash-classified dialysis sessions today" tone="bg-amber-50 text-amber-600" />
        <Metric icon={ClipboardCheck} label="Cash sessions this month" value={stats?.cashThisMonth} note={`${stats?.cashAllTime ?? 0} cash sessions recorded all time`} tone="bg-blue-50 text-blue-600" />
        <Metric icon={Users} label="Cash patients" value={stats?.cashPatients} note="Distinct patients with a cash session" tone="bg-emerald-50 text-emerald-600" />
        <Metric icon={AlertCircle} label="Missing reasons" value={stats?.missingReasons} note="Cash records that still need a treatment reason" tone={stats?.missingReasons ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
          <div>
            <h2 className="font-extrabold text-slate-900">Seven-day cash activity</h2>
            <p className="mt-1 text-xs text-slate-400">Sessions and incomplete reasons</p>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashierSummary?.cashTrend ?? []} margin={{ left: -24, right: 4 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={{ border: 0, borderRadius: 16, boxShadow: "0 12px 30px rgb(15 23 42 / .12)" }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="sessions" name="Cash sessions" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={34} />
                <Bar dataKey="missingReasons" name="Missing reasons" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-extrabold text-slate-900">Recent cash sessions</h2>
              <p className="mt-1 text-xs text-slate-400">Latest records assigned to cash payment</p>
            </div>
            <Link to="/sessions" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">All sessions</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="px-5 py-3">Patient</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Reason</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <tr><td colSpan={3} className="p-8 text-center text-slate-400">Loading cashier data...</td></tr>}
                {!loading && recent.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400">No cash sessions recorded yet.</td></tr>}
                {recent.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-50">
                    <td className="px-5 py-3"><p className="font-bold text-slate-800">{session.patient_name}</p><p className="text-xs text-slate-400">{session.patient_id}</p></td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(session.createdAt)}</td>
                    <td className="px-5 py-3">{session.reason ? <span className="text-slate-600">{session.reason}</span> : <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">Needs reason</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CashierDashboard;
