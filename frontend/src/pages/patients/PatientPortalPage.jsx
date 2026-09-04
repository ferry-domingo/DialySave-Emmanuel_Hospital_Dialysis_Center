import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Banknote, Bell, CalendarClock, CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";

import api from "../../api/axios";
import OnlineUsersCard from "../../components/dashboard/OnlineUsersCard";
import Topbar from "../../components/layout/Topbar";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { formatDoctorName } from "../../utils/doctorName";

const formatDate = (date) => date
  ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  : "—";

const formatTime = (date) => date
  ? new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
  : "—";

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{Icon && <Icon size={12} className="shrink-0 text-blue-600" />}{label}</p>
    <p className="mt-1 break-words text-[13px] font-bold leading-snug text-slate-950" title={String(value || "")}>{value || "—"}</p>
  </div>
);

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon size={16} /></span>
    <div className="min-w-0"><p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-500">{label}</p><p className="mt-1 whitespace-nowrap text-sm font-black leading-none text-slate-950">{value ?? "—"}</p></div>
  </div>
);

const PatientSummary = ({ sessionCount, phicSessions, cashSessions, className = "" }) => (
  <section className={`overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm ${className}`} aria-label="Patient summary">
    <div className="grid min-h-[5.375rem] grid-cols-3 divide-x divide-slate-100">
      <StatTile icon={Activity} label="Total Sessions" value={sessionCount} />
      <StatTile icon={ShieldCheck} label="PHIC Sessions" value={`${phicSessions}/156`} />
      <StatTile icon={Banknote} label="Cash Sessions" value={cashSessions} />
    </div>
  </section>
);

const CompactTreatmentDetail = ({ label, value, subvalue }) => (
  <div className="flex min-h-[3rem] min-w-0 flex-col justify-center rounded-md bg-slate-50 px-2.5 py-2">
    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-slate-900" title={String(value || "")}>{value || "Not recorded"}</p>
    {subvalue && <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-slate-500">{subvalue}</p>}
  </div>
);

const PanelHeader = ({ icon: Icon, title, subtitle, tone = "bg-slate-50 text-slate-600", to }) => (
  <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2.5">
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={15} /></span>
    <div className="min-w-0 flex-1"><h2 className="truncate text-[13px] font-extrabold text-slate-950">{title}</h2><p className="truncate text-[10px] font-medium text-slate-500">{subtitle}</p></div>
    {to && <Link to={to} className="shrink-0 text-[11px] font-bold text-blue-700 hover:text-blue-900">View all</Link>}
  </div>
);

const PhicMonitoringPanel = ({ phicSessions }) => (
  <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
    <PanelHeader icon={ShieldCheck} title="PHIC Monitoring" subtitle="bilang ng Phic na nagamitt" tone="bg-emerald-50 text-emerald-600" to="/patient-phic-monitoring" />
    <div className="space-y-3 p-3"><div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">na gamit na PHIC sessions</p><p className="mt-1 text-2xl font-black text-slate-950">{phicSessions}<span className="text-sm font-bold text-slate-400"> / 156</span></p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">may {Math.max(0, 156 - phicSessions)} pang natitira</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min((phicSessions / 156) * 100, 100)}%` }} /></div></div>
  </section>
);

const DialyzerMonitoringPanel = ({ dialyzerSessions, latestDialyzer }) => (
  <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
    <PanelHeader icon={Activity} title="Dialyzer Monitoring" subtitle="bilang ng dialyzer na nagamit" tone="bg-cyan-50 text-cyan-600" to="/patient-phic-monitoring" />
    <div className="flex items-center justify-between gap-3 p-3"><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">na gamit na dialyzezr</p><p className="mt-1 text-2xl font-black text-slate-950">{dialyzerSessions}</p></div><div className="min-w-0 rounded-lg bg-cyan-50 px-3 py-2 text-right"><p className="text-[9px] font-semibold text-cyan-700">Huling gamit ng dialyzer</p><p className="text-[11px] font-bold text-cyan-900">{latestDialyzer?.date ? formatDate(latestDialyzer.date) : "No date"}</p></div></div>
  </section>
);

const PatientPortalPage = () => {
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPortal = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const identifier = user?.patient?._id || (typeof user?.patient === "string" ? user.patient : "") || user?.loginId || user?.id;
        const [patientRes, portalRes] = await Promise.all([api.get(`/patients/${identifier}`), api.get(`/patient-portal/${identifier}`)]);
        const patient = patientRes.data.data;
        const data = portalRes.data.data;
        setPortalData({
          profile: {
            fullName: `${patient.first_name} ${patient.last_name}`.trim(), patientId: patient.patient_id,
            status: patient.status, doctorName: formatDoctorName(patient.doctor) || "Not assigned",
            contactNumber: patient.contact_number, birthdate: patient.birthdate, bloodType: patient.blood_type,
          },
          summary: { sessionCount: data?.sessions?.length || 0 }, sessions: data?.sessions || [],
          monitoring: data?.monitoring || null, admissionReport: data?.admissionReport || null,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your portal.");
      } finally {
        if (!silent) setLoading(false);
      }
    };
    const handleRealtimeUpdate = (event) => {
      if (["patients", "dialysis-sessions", "monitoring", "admission-report"].includes(event.detail?.resource)) fetchPortal(true);
    };
    if (user) fetchPortal();
    window.addEventListener("dialysave:data-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("dialysave:data-changed", handleRealtimeUpdate);
  }, [user]);

  const recentSessions = useMemo(() => [...(portalData?.sessions ?? [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [portalData]);
  const latestSession = recentSessions[0];
  const paymentCounts = recentSessions.reduce((counts, session) => ({ ...counts, [session.payment_type]: (counts[session.payment_type] || 0) + 1 }), {});
  const phicSessions = paymentCounts.PHIC || 0;
  const cashSessions = paymentCounts.CASH || 0;
  const dialyzerSessions = portalData?.monitoring?.dialyzer?.total || recentSessions.filter((session) => session.dialyzer?.name?.trim()).length;
  const latestDialyzer = portalData?.monitoring?.dialyzer?.sessions?.at(-1) || recentSessions.find((session) => session.dialyzer?.name?.trim())?.dialyzer;
  const upcomingAppointments = notifications.filter((notification) => notification.type === "Dialysis Schedule" && new Date(notification.scheduledFor || notification.createdAt) >= new Date()).slice(0, 5);
  const recentAlerts = notifications.filter((notification) => notification.type !== "Dialysis Schedule").slice(0, 3);

  return (
    <div className="patient-dashboard-readable min-w-0 space-y-2.5 2xl:flex 2xl:h-full 2xl:flex-col 2xl:space-y-0 2xl:overflow-hidden">
      <Topbar title="Dashboard" />
      {loading && <div className="mt-2.5 grid flex-1 place-items-center rounded-xl bg-white text-sm text-slate-400 shadow-sm">Loading your patient portal...</div>}
      {error && <div className="mt-2.5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid min-h-0 w-full gap-2.5 xl:mt-2.5 xl:grid-cols-2 2xl:flex-1 2xl:grid-cols-[minmax(15rem,16.375rem)_minmax(26.25rem,1fr)_16.875rem_13.4375rem] 2xl:overflow-hidden">
          <div className="grid min-h-0 gap-2.5 2xl:grid-rows-[96px_auto_minmax(0,1fr)]">
            <section className="relative min-h-[6rem] overflow-hidden rounded-xl bg-[#173d31] p-4 text-white shadow-sm">
              <div className="absolute -right-10 -top-20 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative flex h-full items-center"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Patient dialysis overview</p><h1 className="mt-1 break-words text-base font-black leading-tight" title={portalData?.profile?.fullName || "Patient"}>Welcome, {portalData?.profile?.fullName || "Patient"}.</h1><p className="mt-1 text-[11px] font-medium text-emerald-50">Narito ang impormasyon tungkol sa dialysis mo.</p></div></div>
            </section>

            <PatientSummary
              sessionCount={portalData?.summary?.sessionCount ?? 0}
              phicSessions={phicSessions}
              cashSessions={cashSessions}
              className="xl:hidden"
            />

          </div>

          <div className="grid min-h-0 gap-2.5 2xl:grid-rows-[96px_260px_minmax(0,1fr)]">
            <PatientSummary
              sessionCount={portalData?.summary?.sessionCount ?? 0}
              phicSessions={phicSessions}
              cashSessions={cashSessions}
              className="hidden xl:block"
            />

            <PhicMonitoringPanel phicSessions={phicSessions} />

            <DialyzerMonitoringPanel dialyzerSessions={dialyzerSessions} latestDialyzer={latestDialyzer} />

            <section className="h-full w-full min-w-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <PanelHeader icon={Activity} title="Latest Treatment" subtitle="Pinakahuling dialysis session" tone="bg-cyan-50 text-cyan-600" to="/patient-sessions" />
              {latestSession ? <div className="p-2.5"><div className="flex min-w-0 items-center justify-between gap-3"><div className="min-w-0"><p className="text-[7px] font-bold uppercase text-slate-400">Session ID</p><p className="truncate text-sm font-extrabold text-slate-900">{latestSession.session_id}</p></div><time className="shrink-0 text-[8px] font-semibold text-slate-500">{formatDate(latestSession.createdAt)}</time></div><div className="mt-1.5 grid grid-cols-2 gap-1 sm:grid-cols-3"><CompactTreatmentDetail label="Doctor" value={formatDoctorName(latestSession.doctor) || portalData?.profile?.doctorName} /><CompactTreatmentDetail label="Coverage" value={latestSession.payment_type || "N/A"} /><CompactTreatmentDetail label="Injection" value={latestSession.injections?.name} subvalue={latestSession.injections?.payment_type && `Coverage: ${latestSession.injections.payment_type}`} /><CompactTreatmentDetail label="Dialyzer" value={latestSession.dialyzer?.name} subvalue={latestSession.dialyzer?.payment_type && `Coverage: ${latestSession.dialyzer.payment_type}`} /><CompactTreatmentDetail label="IV Iron" value={latestSession.intravenous_iron?.name} subvalue={latestSession.intravenous_iron?.payment_type && `Coverage: ${latestSession.intravenous_iron.payment_type}`} /><CompactTreatmentDetail label="Laboratory Request" value={latestSession.laboratory_request?.length ? `${latestSession.laboratory_request.filter((item) => item.done).length}/${latestSession.laboratory_request.length} used` : "No tests"} /></div><Link to={`/patient-sessions?session=${encodeURIComponent(latestSession._id || latestSession.session_id)}`} className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[9px] font-bold text-blue-600">Tingnan ang buong detalye <ArrowRight size={12} /></Link></div> : <p className="p-5 text-center text-xs text-slate-400">No sessions recorded yet.</p>}
            </section>

          </div>

          <div className="grid min-h-0 gap-2.5 xl:grid-rows-[minmax(140px,1fr)_minmax(140px,1fr)_auto]">
            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={CalendarClock} title="Upcoming Appointments" subtitle="Nakatakdang dialysis sessions" tone="bg-emerald-50 text-emerald-600" to="/alerts" /><div className="divide-y divide-slate-100 px-3">{upcomingAppointments.map((appointment) => <Link key={appointment._id} to="/alerts" className="flex min-w-0 items-center gap-2 py-2"><CalendarDays size={13} className="shrink-0 text-emerald-600" /><span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">{appointment.title}</b><small className="block truncate text-[8px] text-slate-400">{formatTime(appointment.scheduledFor)}</small></span></Link>)}{!upcomingAppointments.length && <p className="py-3 text-center text-[9px] text-slate-400">No upcoming appointments</p>}</div></section>

            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={Bell} title="Recent Alerts" subtitle="Pinakabagong abiso" tone="bg-amber-50 text-amber-600" to="/alerts" /><div className="divide-y divide-slate-100 px-3">{recentAlerts.map((alert) => <Link key={alert._id} to="/alerts" className="flex min-w-0 items-center gap-2 py-1.5"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${alert.isRead ? "bg-slate-300" : "bg-amber-500"}`} /><span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">{alert.title}</b><small className="block truncate text-[7px] text-slate-400">{formatTime(alert.createdAt)}</small></span></Link>)}{!recentAlerts.length && <p className="py-3 text-center text-[9px] text-slate-400">No recent alerts</p>}</div></section>

            <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={CalendarDays} title="Admission Overview" subtitle="Kasalukuyang admission record" tone="bg-amber-50 text-amber-600" />{portalData?.admissionReport ? <div className="p-3"><div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2"><p className="text-[8px] font-bold uppercase text-emerald-600">Admission status</p><div className="mt-1 flex justify-between"><strong className="text-sm text-slate-900">{portalData.admissionReport.status}</strong><CheckCircle2 size={14} className="text-emerald-600" /></div></div><div className="mt-2 grid grid-cols-2 gap-1.5"><InfoTile label="Admission Date" value={formatDate(portalData.admissionReport.admission_date)} /><InfoTile label="Discharge Date" value={portalData.admissionReport.status === "Discharged" && portalData.admissionReport.discharge_date ? formatDate(portalData.admissionReport.discharge_date) : "N/A"} /></div></div> : <p className="p-4 text-center text-[9px] text-slate-400">No admission report</p>}</section>
          </div>

          <aside className="hidden h-full min-h-0 overflow-hidden md:block"><OnlineUsersCard tall /></aside>
        </div>
      )}
    </div>
  );
};

export default PatientPortalPage;
