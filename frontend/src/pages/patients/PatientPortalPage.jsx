import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, BadgeCheck, Banknote, Bell, CalendarDays, CheckCircle2, Droplets, HeartPulse, IdCard, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

import api from "../../api/axios";
import OnlineUsersCard from "../../components/dashboard/OnlineUsersCard";
import Topbar from "../../components/layout/Topbar";
import { useAuthStore } from "../../store/authStore";
import { useMessageStore } from "../../store/messageStore";
import { useNotificationStore } from "../../store/notificationStore";
import { formatDoctorName } from "../../utils/doctorName";

const formatDate = (date) => date
  ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  : "—";

const formatTime = (date) => date
  ? new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
  : "—";

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2">
    <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-slate-400">{Icon && <Icon size={10} className="shrink-0 text-blue-500" />}{label}</p>
    <p className="mt-1 truncate text-[11px] font-semibold text-slate-900" title={String(value || "")}>{value || "—"}</p>
  </div>
);

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="flex min-w-0 items-center gap-2 px-2.5 py-2">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Icon size={13} /></span>
    <div className="min-w-0"><p className="truncate text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate text-xs font-extrabold text-slate-900">{value || "—"}</p></div>
  </div>
);

const CompactTreatmentDetail = ({ label, value, subvalue }) => (
  <div className="flex min-h-[38px] min-w-0 flex-col justify-center rounded-md bg-slate-50 px-2 py-1.5">
    <p className="truncate text-[7px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-0.5 truncate text-[9px] font-semibold leading-tight text-slate-800" title={String(value || "")}>{value || "Not recorded"}</p>
    {subvalue && <p className="mt-0.5 truncate text-[7px] text-slate-400">{subvalue}</p>}
  </div>
);

const PanelHeader = ({ icon: Icon, title, subtitle, tone = "bg-slate-50 text-slate-600", to }) => (
  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={13} /></span>
    <div className="min-w-0 flex-1"><h2 className="truncate text-xs font-extrabold text-slate-900">{title}</h2><p className="truncate text-[8px] text-slate-400">{subtitle}</p></div>
    {to && <Link to={to} className="shrink-0 text-[8px] font-bold text-blue-600">View all</Link>}
  </div>
);

const RecentTreatmentsPanel = ({ sessions }) => (
  <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
    <PanelHeader icon={Activity} title="Recent Treatments" subtitle="Latest dialysis history" tone="bg-emerald-50 text-emerald-600" to="/patient-sessions" />
    <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-hidden px-3">
      {sessions.slice(0, 7).map((session, index) => (
        <Link key={session._id || session.session_id} to={`/patient-sessions?session=${encodeURIComponent(session._id || session.session_id)}`} className="flex min-w-0 items-center gap-2 py-1.5">
          <span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">Session #{sessions.length - index} · {session.session_id}</b><small className="block text-[7px] text-slate-400">{session.payment_type || "N/A"}</small></span>
          <time className="shrink-0 text-[7px] text-slate-400">{formatDate(session.createdAt)}</time>
        </Link>
      ))}
      {!sessions.length && <p className="py-3 text-center text-[9px] text-slate-400">No recent treatments</p>}
    </div>
  </section>
);

const PatientPortalPage = () => {
  const user = useAuthStore((state) => state.user);
  const conversations = useMessageStore((state) => state.conversations);
  const notifications = useNotificationStore((state) => state.notifications);
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };
    const handleRealtimeUpdate = (event) => {
      if (["patients", "dialysis-sessions", "monitoring", "admission-report"].includes(event.detail?.resource)) fetchPortal();
    };
    if (user) fetchPortal();
    window.addEventListener("dialysave:data-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("dialysave:data-changed", handleRealtimeUpdate);
  }, [user]);

  const recentSessions = useMemo(() => [...(portalData?.sessions ?? [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [portalData]);
  const latestSession = recentSessions[0];
  const phicSessions = portalData?.monitoring?.phic?.total || 0;
  const paymentCounts = recentSessions.reduce((counts, session) => ({ ...counts, [session.payment_type]: (counts[session.payment_type] || 0) + 1 }), {});
  const chronologicalSessions = [...recentSessions].reverse();
  const treatmentIntervals = chronologicalSessions.slice(1).map((session, index) => Math.max(0, (new Date(session.createdAt) - new Date(chronologicalSessions[index].createdAt)) / 86400000));
  const averageTreatmentGap = treatmentIntervals.length ? Math.round(treatmentIntervals.reduce((sum, days) => sum + days, 0) / treatmentIntervals.length) : 0;
  const latestLaboratorySession = recentSessions.find((session) => session.laboratory_results?.some((item) => item.done));
  const nextLaboratoryDate = latestLaboratorySession
    ? new Date(new Date(latestLaboratorySession.createdAt).getFullYear(), new Date(latestLaboratorySession.createdAt).getMonth() + 1, 1)
    : null;
  const nextLaboratoryUsage = !nextLaboratoryDate || nextLaboratoryDate <= new Date() ? "Available now" : formatDate(nextLaboratoryDate);
  const activeTreatmentMonths = new Set(recentSessions.map((session) => {
    const date = new Date(session.createdAt);
    return `${date.getFullYear()}-${date.getMonth()}`;
  })).size;
  const currentMonth = new Date();
  const sessionsThisMonth = recentSessions.filter((session) => {
    const date = new Date(session.createdAt);
    return date.getFullYear() === currentMonth.getFullYear() && date.getMonth() === currentMonth.getMonth();
  }).length;
  const daysSinceTreatment = latestSession ? Math.max(0, Math.floor((Date.now() - new Date(latestSession.createdAt).getTime()) / 86400000)) : null;

  return (
    <div className="min-w-0 space-y-2.5 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:overflow-hidden">
      <Topbar title="Patient workspace" />
      {loading && <div className="mt-2.5 grid flex-1 place-items-center rounded-xl bg-white text-sm text-slate-400 shadow-sm">Loading your patient portal...</div>}
      {error && <div className="mt-2.5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid min-h-0 w-full gap-2.5 xl:mt-2.5 xl:flex-1 xl:grid-cols-[minmax(240px,262px)_minmax(420px,1fr)_270px_215px] xl:overflow-hidden">
          <div className="grid min-h-0 gap-2.5 xl:grid-rows-[86px_228px_minmax(0,1fr)]">
            <section className="relative min-h-[86px] overflow-hidden rounded-xl bg-[#173d31] p-3 text-white shadow-sm">
              <div className="absolute -right-10 -top-20 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative flex h-full items-center"><div className="min-w-0"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-200"><HeartPulse size={11} />Patient overview</p><h1 className="mt-1 break-words text-sm font-black leading-tight" title={portalData?.profile?.fullName || "Patient"}>Welcome, {portalData?.profile?.fullName || "Patient"}.</h1><p className="mt-1 truncate text-[8px] text-emerald-50/70">Your dialysis care summary at a glance.</p></div></div>
            </section>

            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <PanelHeader icon={UserRound} title="Medical Profile" subtitle="Essential care information" tone="bg-violet-50 text-violet-600" />
              <div className="grid grid-cols-2 gap-2 p-3">
                <InfoTile icon={IdCard} label="Patient ID" value={portalData?.profile?.patientId} />
                <InfoTile icon={UserRound} label="Primary Doctor" value={portalData?.profile?.doctorName} />
                <InfoTile icon={Phone} label="Contact" value={portalData?.profile?.contactNumber || "Not provided"} />
                <InfoTile icon={CalendarDays} label="Birthdate" value={formatDate(portalData?.profile?.birthdate)} />
                <InfoTile icon={Droplets} label="Blood Type" value={portalData?.profile?.bloodType} />
                <InfoTile icon={BadgeCheck} label="Status" value={portalData?.profile?.status || "Active"} />
              </div>
            </section>
            <RecentTreatmentsPanel sessions={recentSessions} />
          </div>

          <div className="grid min-h-0 gap-2.5 xl:grid-rows-[86px_228px_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm" aria-label="Patient summary"><div className="grid h-full grid-cols-3 divide-x divide-slate-100"><StatTile icon={Activity} label="Total Sessions" value={portalData?.summary?.sessionCount || 0} /><StatTile icon={ShieldCheck} label="PHIC Sessions" value={`${phicSessions}/156`} /><StatTile icon={Banknote} label="Cash Sessions" value={portalData?.monitoring?.cash?.total || 0} /></div></section>

            <section className="h-full w-full min-w-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <PanelHeader icon={Activity} title="Latest Treatment" subtitle="Most recent dialysis session" tone="bg-cyan-50 text-cyan-600" to="/patient-sessions" />
              {latestSession ? <div className="p-2.5"><div className="flex min-w-0 items-center justify-between gap-3"><div className="min-w-0"><p className="text-[7px] font-bold uppercase text-slate-400">Session ID</p><p className="truncate text-sm font-extrabold text-slate-900">{latestSession.session_id}</p></div><time className="shrink-0 text-[8px] font-semibold text-slate-500">{formatDate(latestSession.createdAt)}</time></div><div className="mt-1.5 grid grid-cols-2 gap-1 sm:grid-cols-3"><CompactTreatmentDetail label="Doctor" value={formatDoctorName(latestSession.doctor) || portalData?.profile?.doctorName} /><CompactTreatmentDetail label="Coverage" value={latestSession.payment_type || "N/A"} /><CompactTreatmentDetail label="Injection" value={latestSession.injections?.name} subvalue={latestSession.injections?.payment_type && `Coverage: ${latestSession.injections.payment_type}`} /><CompactTreatmentDetail label="Dialyzer" value={latestSession.dialyzer?.name} subvalue={latestSession.dialyzer?.payment_type && `Coverage: ${latestSession.dialyzer.payment_type}`} /><CompactTreatmentDetail label="IV Iron" value={latestSession.intravenous_iron?.name} subvalue={latestSession.intravenous_iron?.payment_type && `Coverage: ${latestSession.intravenous_iron.payment_type}`} /><CompactTreatmentDetail label="Laboratory" value={latestSession.laboratory_results?.length ? `${latestSession.laboratory_results.filter((item) => item.done).length}/${latestSession.laboratory_results.length} used` : "No tests"} /></div><Link to={`/patient-sessions?session=${encodeURIComponent(latestSession._id || latestSession.session_id)}`} className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[9px] font-bold text-blue-600">Open full treatment details <ArrowRight size={12} /></Link></div> : <p className="p-5 text-center text-xs text-slate-400">No sessions recorded yet.</p>}
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
              <PanelHeader icon={ShieldCheck} title="Treatment Insights" subtitle="Care utilization at a glance" tone="bg-blue-50 text-blue-600" />
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0"><InfoTile label="PHIC Remaining" value={Math.max(0, 156 - phicSessions)} /><InfoTile label="Average Treatment Gap" value={`${averageTreatmentGap} days`} /><InfoTile label="Next Laboratory Usage" value={nextLaboratoryUsage} /><InfoTile label="Active Treatment Months" value={activeTreatmentMonths} /></div>
              <div className="border-t border-slate-100 px-3 py-2"><div className="flex justify-between text-[8px] font-semibold text-slate-500"><span>Annual PHIC capacity used</span><span>{Math.min(phicSessions, 156)} / 156</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min((phicSessions / 156) * 100, 100)}%` }} /></div></div>
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 border-t border-slate-100 p-3">
                <div className="flex min-h-0 flex-col rounded-lg bg-slate-50 p-2.5"><p className="text-[8px] font-bold uppercase text-slate-400">Care activity</p><div className="mt-1 flex min-h-0 flex-1 flex-col justify-evenly"><div className="flex justify-between text-[9px]"><span className="text-slate-500">Sessions this month</span><b>{sessionsThisMonth}</b></div><div className="flex justify-between text-[9px]"><span className="text-slate-500">Last treatment</span><b>{formatDate(latestSession?.createdAt)}</b></div><div className="flex justify-between text-[9px]"><span className="text-slate-500">Days since treatment</span><b>{daysSinceTreatment ?? "N/A"}</b></div></div></div>
                <div className="rounded-lg bg-slate-50 p-2.5"><p className="text-[8px] font-bold uppercase text-slate-400">Session mix</p><div className="mt-2 space-y-2">{["PHIC", "CASH", "PCSO", "MISC / V.A.S"].map((type) => <div key={type} className="flex items-center gap-2 text-[9px]"><span className="min-w-0 flex-1 truncate text-slate-500">{type}</span><div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-500" style={{ width: `${recentSessions.length ? ((paymentCounts[type] || 0) / recentSessions.length) * 100 : 0}%` }} /></div><b className="w-4 text-right">{paymentCounts[type] || 0}</b></div>)}</div></div>
              </div>
            </section>
          </div>

          <div className="grid min-h-0 gap-2.5 xl:grid-rows-[minmax(140px,1fr)_minmax(140px,1fr)_auto]">
            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={Mail} title="Recent Messages" subtitle="Latest conversations" tone="bg-blue-50 text-blue-600" to="/messages" /><div className="divide-y divide-slate-100 px-3">{conversations.slice(0, 3).map((conversation) => <Link key={conversation._id} to="/messages" className="flex min-w-0 items-center gap-2 py-1.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Mail size={11} /></span><span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">{conversation.lastMessage?.sender?.name || conversation.lastMessage?.sender?.username || "Conversation"}</b><small className="block truncate text-[7px] text-slate-400">{conversation.lastMessage?.text || "New message"}</small></span>{conversation.unreadCount > 0 && <b className="rounded-full bg-emerald-600 px-1.5 text-[7px] text-white">{conversation.unreadCount}</b>}</Link>)}{!conversations.length && <p className="py-3 text-center text-[9px] text-slate-400">No recent messages</p>}</div></section>

            <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={Bell} title="Recent Alerts" subtitle="Latest care notifications" tone="bg-amber-50 text-amber-600" to="/alerts" /><div className="divide-y divide-slate-100 px-3">{notifications.slice(0, 3).map((alert) => <Link key={alert._id} to="/alerts" className="flex min-w-0 items-center gap-2 py-1.5"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${alert.isRead ? "bg-slate-300" : "bg-amber-500"}`} /><span className="min-w-0 flex-1"><b className="block truncate text-[9px] text-slate-700">{alert.title}</b><small className="block truncate text-[7px] text-slate-400">{formatTime(alert.createdAt)}</small></span></Link>)}{!notifications.length && <p className="py-3 text-center text-[9px] text-slate-400">No recent alerts</p>}</div></section>

            <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm"><PanelHeader icon={CalendarDays} title="Admission Overview" subtitle="Current admission record" tone="bg-amber-50 text-amber-600" />{portalData?.admissionReport ? <div className="p-3"><div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2"><p className="text-[8px] font-bold uppercase text-emerald-600">Admission status</p><div className="mt-1 flex justify-between"><strong className="text-sm text-slate-900">{portalData.admissionReport.status}</strong><CheckCircle2 size={14} className="text-emerald-600" /></div></div><div className="mt-2 grid grid-cols-2 gap-1.5"><InfoTile label="Admission Date" value={formatDate(portalData.admissionReport.admission_date)} /><InfoTile label="Discharge Date" value={portalData.admissionReport.status === "Discharged" && portalData.admissionReport.discharge_date ? formatDate(portalData.admissionReport.discharge_date) : "N/A"} /></div></div> : <p className="p-4 text-center text-[9px] text-slate-400">No admission report</p>}</section>
          </div>

          <aside className="h-full min-h-0 overflow-hidden"><OnlineUsersCard tall /></aside>
        </div>
      )}
    </div>
  );
};

export default PatientPortalPage;
