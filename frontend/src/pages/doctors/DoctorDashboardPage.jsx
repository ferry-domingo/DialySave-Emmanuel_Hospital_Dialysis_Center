import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Bell, CalendarDays, ChevronRight, CircleUserRound, HeartPulse, Mail, Search, Stethoscope, UserCheck, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import api from "../../api/axios";
import OnlineUsersCard from "../../components/dashboard/OnlineUsersCard";
import Topbar from "../../components/layout/Topbar";
import { useMessageStore } from "../../store/messageStore";
import { useNotificationStore } from "../../store/notificationStore";
import { formatDoctorName } from "../../utils/doctorName";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
  : "—";

const patientName = (patient) => [patient?.first_name, patient?.middle_name, patient?.last_name].filter(Boolean).join(" ");

const ACTIVITY_PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "history", label: "All history" },
];

const PanelHeader = ({ icon: Icon, title, subtitle, tone = "bg-slate-50 text-slate-600", to }) => (
  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={14} /></span>
    <div className="min-w-0 flex-1"><h2 className="truncate text-[13px] font-extrabold text-slate-950">{title}</h2><p className="truncate text-[8px] font-medium text-slate-500">{subtitle}</p></div>
    {to && <Link to={to} className="shrink-0 text-[9px] font-bold text-emerald-700">View all</Link>}
  </div>
);

const InfoTile = ({ label, value }) => (
  <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
    <p className="truncate text-[8px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-0.5 break-words text-xs font-bold leading-snug text-slate-950" title={String(value || "")}>{value || "—"}</p>
  </div>
);

const StatTile = ({ icon: Icon, label, value, tone }) => (
  <div className="flex min-w-0 items-center gap-2 px-3 py-2">
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={13} /></span>
    <div className="min-w-0"><p className="text-[9px] font-bold uppercase leading-tight text-slate-500">{label}</p><p className="mt-1 truncate text-base font-black leading-none text-slate-950">{value ?? 0}</p></div>
  </div>
);

const DoctorDashboardPage = () => {
  const conversations = useMessageStore((state) => state.conversations);
  const notifications = useNotificationStore((state) => state.notifications);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [activityPeriod, setActivityPeriod] = useState("week");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/doctors/me/dashboard");
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your doctor dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const refresh = (event) => {
      if (["patients", "dialysis-sessions", "doctors"].includes(event.detail?.resource)) loadDashboard();
    };
    window.addEventListener("dialysave:data-changed", refresh);
    return () => window.removeEventListener("dialysave:data-changed", refresh);
  }, []);

  const patients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.patients || []).filter((patient) => !term || JSON.stringify(patient).toLowerCase().includes(term));
  }, [data, search]);

  const sessions = useMemo(() => (data?.sessions || []).filter((session) => !selectedPatient || session.patient?._id === selectedPatient), [data, selectedPatient]);
  const assignedTreatmentSessions = useMemo(() => {
    const assignedPatientIds = new Set((data?.patients || []).map((patient) => String(patient._id)));
    return (data?.sessions || []).filter((session) => {
      const patientId = String(session.patient?._id ?? session.patient ?? "");
      return assignedPatientIds.has(patientId) && (!selectedPatient || patientId === selectedPatient);
    });
  }, [data, selectedPatient]);
  const treatmentActivity = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const countSessions = (matches) => assignedTreatmentSessions.reduce((total, session) => {
      const sessionDate = new Date(session.createdAt);
      return total + (Number.isNaN(sessionDate.getTime()) ? 0 : Number(matches(sessionDate)));
    }, 0);
    const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return { key: date.toISOString(), label, count: countSessions((sessionDate) => sessionDate.toDateString() === date.toDateString()) };
    });
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const month = Array.from({ length: daysInMonth }, (_, index) => ({
      key: `${now.getFullYear()}-${now.getMonth()}-${index + 1}`,
      label: String(index + 1),
      count: countSessions((sessionDate) => sessionDate.getFullYear() === now.getFullYear() && sessionDate.getMonth() === now.getMonth() && sessionDate.getDate() === index + 1),
    }));
    const year = Array.from({ length: 12 }, (_, index) => ({
      key: `${now.getFullYear()}-${index}`,
      label: new Intl.DateTimeFormat("en-PH", { month: "short" }).format(new Date(now.getFullYear(), index, 1)),
      count: countSessions((sessionDate) => sessionDate.getFullYear() === now.getFullYear() && sessionDate.getMonth() === index),
    }));
    const sessionYears = assignedTreatmentSessions.map((session) => new Date(session.createdAt)).filter((date) => !Number.isNaN(date.getTime())).map((date) => date.getFullYear());
    const firstYear = sessionYears.length ? Math.min(...sessionYears) : now.getFullYear();
    const history = Array.from({ length: now.getFullYear() - firstYear + 1 }, (_, index) => {
      const yearValue = firstYear + index;
      return { key: String(yearValue), label: String(yearValue), count: countSessions((sessionDate) => sessionDate.getFullYear() === yearValue) };
    });

    return {
      periods: { week, month, year, history },
    };
  }, [assignedTreatmentSessions]);
  const activityChartData = treatmentActivity.periods[activityPeriod];
  const activityTotal = activityChartData.reduce((total, item) => total + item.count, 0);
  const activityDescriptions = {
    week: "Monday–Sunday",
    month: `Days 1–${activityChartData.length}`,
    year: "January–December",
    history: "Sessions grouped by year",
  };
  const recentSessions = sessions.slice(0, 7);
  const completedLabs = (data?.sessions || []).reduce((total, session) => total + (session.laboratory_results || []).filter((lab) => lab.done).length, 0);
  const totalLabs = (data?.sessions || []).reduce((total, session) => total + (session.laboratory_results?.length || 0), 0);
  const activePatients = (data?.patients || []).filter((patient) => patient.status === "Active").length;
  const latestSession = data?.sessions?.[0];

  return (
    <div className="doctor-dashboard-readable min-w-0 space-y-2.5 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:overflow-hidden">
      <Topbar title="Doctor workspace" />
      {loading && <div className="mt-2.5 grid flex-1 place-items-center rounded-xl bg-white text-sm text-slate-400 shadow-sm">Loading your assigned patients...</div>}
      {error && <div className="mt-2.5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}

      {!loading && !error && data && (
        <div className="grid min-h-0 w-full gap-2.5 xl:mt-2.5 xl:flex-1 xl:grid-cols-[minmax(240px,262px)_minmax(420px,1fr)_270px_215px] xl:overflow-hidden">
          <div className="grid min-h-0 gap-2.5 xl:grid-rows-[86px_auto_minmax(0,1fr)]">
            <section className="relative min-h-[86px] overflow-hidden rounded-xl bg-[#173d31] p-3 text-white shadow-sm">
              <div className="absolute -right-10 -top-20 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative flex h-full items-center"><div className="min-w-0"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100"><Stethoscope size={12} />Doctor overview</p><h1 className="mt-1 break-words text-base font-black leading-tight">Good day, {formatDoctorName(data.doctor)}.</h1><p className="mt-1 text-[8px] font-medium text-emerald-50">Your assigned care workload at a glance.</p></div></div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <PanelHeader icon={CircleUserRound} title="Doctor Profile" subtitle="Professional information" tone="bg-violet-50 text-violet-600" />
              <div className="grid grid-cols-2 gap-2 p-3"><InfoTile label="Doctor ID" value={data.doctor.doctor_id} /><InfoTile label="Expertise" value={data.doctor.medical_expertise} /><InfoTile label="Contact" value={data.doctor.contact_number} /><InfoTile label="Sex" value={data.doctor.gender} /><InfoTile label="Status" value={data.doctor.status} /><InfoTile label="Assigned Patients" value={data.summary.patientCount} /></div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <PanelHeader icon={Users} title="Assigned Patients" subtitle="Select a patient to filter sessions" tone="bg-blue-50 text-blue-600" to="/doctor-patients" />
              <div className="m-2 flex h-7 items-center gap-2 rounded-lg bg-slate-50 px-2"><Search size={12} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient" className="min-w-0 flex-1 bg-transparent text-[9px] outline-none" /></div>
              <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-hidden px-2">{patients.slice(0, 7).map((patient) => <button key={patient._id} onClick={() => setSelectedPatient(selectedPatient === patient._id ? "" : patient._id)} className={`flex w-full min-w-0 items-center gap-2 px-1 py-1.5 text-left ${selectedPatient === patient._id ? "text-emerald-700" : "text-slate-600"}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ${selectedPatient === patient._id ? "bg-emerald-50" : "bg-slate-50"}`}><CircleUserRound size={12} /></span><span className="min-w-0 flex-1"><b className="block truncate text-[9px]">{patientName(patient)}</b><small className="block text-[7px] text-slate-400">{patient.patient_id} · {patient.blood_type || "N/A"}</small></span><ChevronRight size={10} /></button>)}{!patients.length && <p className="py-4 text-center text-[9px] text-slate-400">No assigned patients</p>}</div>
            </section>
          </div>

          <div className="grid min-h-0 gap-2.5 xl:grid-rows-[86px_248px_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><div className="grid h-full grid-cols-3 divide-x divide-slate-100"><StatTile icon={Users} label="Assigned Patients" value={data.summary.patientCount} tone="bg-blue-50 text-blue-600" /><StatTile icon={Activity} label="Total Sessions" value={data.summary.sessionCount} tone="bg-cyan-50 text-cyan-600" /><StatTile icon={CalendarDays} label="This Month" value={data.summary.sessionsThisMonth} tone="bg-emerald-50 text-emerald-600" /></div></section>

            <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <PanelHeader icon={Activity} title={selectedPatient ? "Patient Sessions" : "Recent Sessions"} subtitle="Latest dialysis treatments" tone="bg-cyan-50 text-cyan-600" to="/doctor-sessions" />
              <div className="divide-y divide-slate-100 px-3">{recentSessions.slice(0, 5).map((session) => <Link key={session._id} to="/doctor-sessions" className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2"><span className="min-w-0"><b className="block truncate text-[10px] text-slate-800">{session.session_id} · {patientName(session.patient)}</b><small className="block truncate text-[8px] text-slate-400">{session.patient?.patient_id} · {session.payment_type || "N/A"} · Labs {session.laboratory_results?.filter((lab) => lab.done).length || 0}/{session.laboratory_results?.length || 0}</small></span><time className="text-[8px] text-slate-400">{formatDate(session.createdAt)}</time></Link>)}{!recentSessions.length && <p className="py-8 text-center text-[9px] text-slate-400">No sessions found</p>}</div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <PanelHeader icon={HeartPulse} title="Care Insights" subtitle="Assigned workload and treatment activity" tone="bg-emerald-50 text-emerald-600" />
              <div className="grid grid-cols-2 gap-2 border-b border-slate-100 px-3 py-2.5 lg:grid-cols-4"><InfoTile label="Active Patients" value={activePatients} /><InfoTile label="Lab Completion" value={`${completedLabs}/${totalLabs}`} /><InfoTile label="Last Session" value={formatDate(latestSession?.createdAt)} /><InfoTile label="Patient Filter" value={selectedPatient ? "Active" : "All"} /></div>
              <div className="min-h-0 flex-1 border-t border-slate-100 p-3">
                <div className="flex h-full min-h-[220px] min-w-0 flex-col rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm" aria-label="Treatment activity">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-[10px] font-extrabold text-slate-800">Treatment activity</p><p className="mt-0.5 text-[8px] text-slate-400">{activityDescriptions[activityPeriod]}</p></div>
                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor="activity-period">Treatment activity period</label>
                      <select id="activity-period" value={activityPeriod} onChange={(event) => setActivityPeriod(event.target.value)} className="h-6 rounded-md border border-slate-200 bg-white px-1.5 text-[9px] font-bold text-slate-600 outline-none focus:border-emerald-400">
                        {ACTIVITY_PERIODS.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}
                      </select>
                      <div className="text-right"><b className="text-base font-black leading-none text-emerald-700">{activityTotal}</b><p className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-slate-400">sessions</p></div>
                    </div>
                  </div>
                  <div className="mt-2 min-h-[160px] min-w-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityChartData} margin={{ top: 18, right: 4, left: -18, bottom: 0 }} barCategoryGap="24%">
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={7} tick={{ fill: "#64748b", fontSize: 8, fontWeight: 600 }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={22} tick={{ fill: "#94a3b8", fontSize: 8 }} />
                        <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(value) => [`${value} session${value === 1 ? "" : "s"}`, "Sessions"]} contentStyle={{ border: "0", borderRadius: "12px", boxShadow: "0 10px 30px rgb(15 23 42 / 0.12)", fontSize: "10px" }} />
                        <Bar dataKey="count" name="Sessions" radius={[5, 5, 0, 0]} maxBarSize={32} minPointSize={3}>
                          {activityChartData.map((item, index) => <Cell key={item.key} fill={index === activityChartData.length - 1 ? "#059669" : "#6ee7b7"} />)}
                          <LabelList dataKey="count" position="top" fill="#475569" fontSize={8} fontWeight={700} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="grid min-h-0 gap-2.5 xl:grid-rows-[auto_minmax(150px,1fr)_minmax(150px,1fr)]">
            <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={UserCheck} title="Clinical Focus" subtitle="Current assigned-care status" tone="bg-violet-50 text-violet-600" /><div className="grid grid-cols-2 gap-2 p-3"><InfoTile label="Selected Patient" value={selectedPatient ? patientName(data.patients.find((patient) => patient._id === selectedPatient)) : "All patients"} /><InfoTile label="Visible Sessions" value={sessions.length} /></div></section>

            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={Mail} title="Recent Messages" subtitle="Latest conversations" tone="bg-blue-50 text-blue-600" to="/messages" /><div className="divide-y divide-slate-100 px-3">{conversations.slice(0, 5).map((conversation) => <Link key={conversation._id} to="/messages" className="flex min-w-0 items-center gap-2 py-1.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Mail size={11} /></span><span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">{conversation.lastMessage?.sender?.name || conversation.lastMessage?.sender?.username || "Conversation"}</b><small className="block truncate text-[7px] text-slate-400">{conversation.lastMessage?.text || "New message"}</small></span>{conversation.unreadCount > 0 && <b className="rounded-full bg-emerald-600 px-1.5 text-[7px] text-white">{conversation.unreadCount}</b>}</Link>)}{!conversations.length && <p className="py-4 text-center text-[9px] text-slate-400">No recent messages</p>}</div></section>

            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={Bell} title="Recent Alerts" subtitle="Latest patient notifications" tone="bg-amber-50 text-amber-600" to="/alerts" /><div className="divide-y divide-slate-100 px-3">{notifications.slice(0, 5).map((alert) => <Link key={alert._id} to="/alerts" className="flex min-w-0 items-center gap-2 py-1.5"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${alert.isRead ? "bg-slate-300" : "bg-amber-500"}`} /><span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">{alert.title}</b><small className="block truncate text-[7px] text-slate-400">{formatDate(alert.createdAt)}</small></span></Link>)}{!notifications.length && <p className="py-4 text-center text-[9px] text-slate-400">No recent alerts</p>}</div></section>
          </div>

          <aside className="h-full min-h-0 overflow-hidden"><OnlineUsersCard tall /></aside>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboardPage;
