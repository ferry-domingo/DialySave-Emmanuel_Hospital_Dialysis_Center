import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Bell, CalendarDays, ChevronRight, CircleUserRound, HeartPulse, Mail, Search, Stethoscope, UserCheck, Users } from "lucide-react";

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
              <div className="grid grid-cols-4 divide-x divide-slate-100"><InfoTile label="Active Patients" value={activePatients} /><InfoTile label="Lab Completion" value={`${completedLabs}/${totalLabs}`} /><InfoTile label="Last Session" value={formatDate(latestSession?.createdAt)} /><InfoTile label="Patient Filter" value={selectedPatient ? "Active" : "All"} /></div>
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 border-t border-slate-100 p-3"><Link to="/doctor-patients" className="flex flex-col justify-center rounded-lg bg-blue-50 p-3"><Users size={16} className="text-blue-600" /><b className="mt-2 text-xs text-slate-900">Patient records</b><span className="mt-1 text-[8px] text-slate-500">Review assigned profiles and medical information</span></Link><Link to="/doctor-sessions" className="flex flex-col justify-center rounded-lg bg-emerald-50 p-3"><Activity size={16} className="text-emerald-600" /><b className="mt-2 text-xs text-slate-900">Treatment history</b><span className="mt-1 text-[8px] text-slate-500">Review supplies, coverage, and lab status</span></Link></div>
            </section>
          </div>

          <div className="grid min-h-0 gap-2.5 xl:grid-rows-[minmax(150px,1fr)_minmax(150px,1fr)_auto]">
            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={Mail} title="Recent Messages" subtitle="Latest conversations" tone="bg-blue-50 text-blue-600" to="/messages" /><div className="divide-y divide-slate-100 px-3">{conversations.slice(0, 5).map((conversation) => <Link key={conversation._id} to="/messages" className="flex min-w-0 items-center gap-2 py-1.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Mail size={11} /></span><span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">{conversation.lastMessage?.sender?.name || conversation.lastMessage?.sender?.username || "Conversation"}</b><small className="block truncate text-[7px] text-slate-400">{conversation.lastMessage?.text || "New message"}</small></span>{conversation.unreadCount > 0 && <b className="rounded-full bg-emerald-600 px-1.5 text-[7px] text-white">{conversation.unreadCount}</b>}</Link>)}{!conversations.length && <p className="py-4 text-center text-[9px] text-slate-400">No recent messages</p>}</div></section>

            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={Bell} title="Recent Alerts" subtitle="Latest patient notifications" tone="bg-amber-50 text-amber-600" to="/alerts" /><div className="divide-y divide-slate-100 px-3">{notifications.slice(0, 5).map((alert) => <Link key={alert._id} to="/alerts" className="flex min-w-0 items-center gap-2 py-1.5"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${alert.isRead ? "bg-slate-300" : "bg-amber-500"}`} /><span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">{alert.title}</b><small className="block truncate text-[7px] text-slate-400">{formatDate(alert.createdAt)}</small></span></Link>)}{!notifications.length && <p className="py-4 text-center text-[9px] text-slate-400">No recent alerts</p>}</div></section>

            <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={UserCheck} title="Clinical Focus" subtitle="Current assigned-care status" tone="bg-violet-50 text-violet-600" /><div className="grid grid-cols-2 gap-2 p-3"><InfoTile label="Selected Patient" value={selectedPatient ? patientName(data.patients.find((patient) => patient._id === selectedPatient)) : "All patients"} /><InfoTile label="Visible Sessions" value={sessions.length} /></div></section>
          </div>

          <aside className="h-full min-h-0 overflow-hidden"><OnlineUsersCard tall /></aside>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboardPage;
