import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Circle, FlaskConical, HeartPulse, Search, Syringe, UserRound } from "lucide-react";

import Topbar from "../../components/layout/Topbar";
import { useDoctorPortalStore } from "../../store/doctorPortalStore";
import { formatDoctorName } from "../../utils/doctorName";

const fullName = (patient) =>
  [patient?.first_name, patient?.middle_name, patient?.last_name].filter(Boolean).join(" ");

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Date unavailable";

const Detail = ({ icon: Icon, label, value, payment, tone = "bg-white text-slate-500" }) => (
  <div className="min-w-0 rounded-xl border border-slate-100/80 bg-slate-50/80 p-2.5">
    <div className="flex items-start gap-2">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg shadow-sm ${tone}`}><Icon size={13} /></span>
      <div className="min-w-0">
        <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-900">{value || "Not recorded"}</p>
        {payment && <p className="mt-0.5 text-[8px] text-slate-500">Coverage: {payment}</p>}
      </div>
    </div>
  </div>
);

const DoctorSessionsPage = () => {
  const { data, loading, error, fetchPortal } = useDoctorPortalStore();
  const [patientId, setPatientId] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessionQuery, setSessionQuery] = useState("");
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);

  useEffect(() => {
    fetchPortal().catch(() => {});
    const refresh = (event) => {
      if (event.detail?.resource === "dialysis-sessions") fetchPortal().catch(() => {});
    };
    window.addEventListener("dialysave:data-changed", refresh);
    return () => window.removeEventListener("dialysave:data-changed", refresh);
  }, [fetchPortal]);

  const selectedPatient = (data?.patients || []).find((patient) => patient._id === patientId);
  const patientOptions = useMemo(() => {
    const term = patientQuery.trim().toLowerCase();
    return (data?.patients || []).filter((patient) =>
      !term || fullName(patient).toLowerCase().includes(term) || patient.patient_id?.toLowerCase().includes(term)
    );
  }, [data, patientQuery]);

  const sortedSessions = useMemo(() => (data?.sessions || [])
    .filter((session) => session.patient?._id === patientId)
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)), [data, patientId]);
  const displayedIndex = selectedSessionId
    ? sortedSessions.findIndex((session) => String(session._id || session.session_id) === selectedSessionId)
    : 0;
  const safeDisplayedIndex = displayedIndex >= 0 ? displayedIndex : 0;
  const displayedSession = sortedSessions[safeDisplayedIndex] || null;
  const displayedSessionNumber = sortedSessions.length - safeDisplayedIndex;

  const sessionOptions = useMemo(() => {
    const term = sessionQuery.trim().toLowerCase();
    return sortedSessions
      .map((session, index) => ({ session, number: sortedSessions.length - index }))
      .filter(({ session, number }) =>
        !term ||
        String(number).includes(term) ||
        `session ${number}`.includes(term) ||
        `#${number}` === term ||
        session.session_id?.toLowerCase().includes(term) ||
        formatDate(session.createdAt).toLowerCase().includes(term)
      );
  }, [sessionQuery, sortedSessions]);

  const selectPatient = (patient) => {
    setPatientId(patient._id);
    setPatientQuery("");
    setPatientMenuOpen(false);
    setSelectedSessionId("");
    setSessionQuery("");
  };

  const selectSession = (session) => {
    setSelectedSessionId(String(session._id || session.session_id));
    setSessionQuery("");
    setSessionMenuOpen(false);
  };

  return (
    <div className="min-w-0 space-y-2.5 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:overflow-hidden">
      <Topbar title="Patient Sessions" />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/70 px-3 py-2 shadow-sm">
        <div className="flex min-h-8 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><HeartPulse size={15} /></span>
          <div className="min-w-0">
            <h2 className="truncate leading-tight text-sm font-extrabold text-slate-900">{selectedPatient ? fullName(selectedPatient) : "Select a patient"}</h2>
            <p className="mt-0.5 leading-tight text-[9px] text-slate-500">Only one dialysis session is displayed at a time.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <div className="flex h-8 items-center gap-2 rounded-xl bg-white px-3 shadow-sm">
              <UserRound size={13} className="text-slate-400" />
              <input
                value={patientMenuOpen ? patientQuery : (selectedPatient ? fullName(selectedPatient) : patientQuery)}
                onFocus={(event) => { setPatientQuery(""); setPatientMenuOpen(true); event.target.select(); }}
                onBlur={() => setPatientMenuOpen(false)}
                onChange={(event) => { setPatientQuery(event.target.value); setPatientMenuOpen(true); }}
                placeholder="Search patient name or ID"
                className="w-48 bg-transparent text-[10px] leading-none text-black outline-none placeholder:text-slate-400"
              />
              <ChevronDown size={12} className="text-slate-400" />
            </div>
            {patientMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 max-h-64 w-72 overflow-y-auto rounded-2xl bg-white py-1.5 shadow-lg">
                {patientOptions.map((patient) => (
                  <button key={patient._id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectPatient(patient)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50">
                    <span className="truncate text-[10px] font-semibold text-slate-900">{fullName(patient)}</span>
                    <span className="shrink-0 text-[9px] text-slate-500">{patient.patient_id}</span>
                  </button>
                ))}
                {!patientOptions.length && <p className="p-4 text-center text-xs text-slate-400">No matching patient.</p>}
              </div>
            )}
          </div>

          <div className={`relative ${!patientId ? "pointer-events-none opacity-50" : ""}`}>
            <div className="flex h-8 items-center gap-2 rounded-xl bg-white px-3 shadow-sm">
              <Search size={13} className="text-slate-400" />
              <input
                disabled={!patientId}
                value={sessionQuery}
                onFocus={(event) => { setSessionQuery(""); setSessionMenuOpen(true); event.target.select(); }}
                onBlur={() => setSessionMenuOpen(false)}
                onChange={(event) => { setSessionQuery(event.target.value); setSessionMenuOpen(true); }}
                placeholder="Search session # or date"
                className="w-60 bg-transparent text-[11px] leading-none text-black outline-none placeholder:font-medium placeholder:text-slate-500"
              />
              <ChevronDown size={12} className="text-slate-400" />
            </div>
            {sessionMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 max-h-64 w-80 overflow-y-auto rounded-2xl bg-white py-1.5 shadow-lg">
                {sessionOptions.map(({ session, number }) => (
                  <button key={session._id || session.session_id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectSession(session)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50">
                    <span><b className="block text-xs text-slate-900">Session {number}</b><small className="text-[10px] text-slate-400">{session.session_id}</small></span>
                    <span className="shrink-0 text-[11px] text-slate-500">{formatDate(session.createdAt)}</span>
                  </button>
                ))}
                {!sessionOptions.length && <p className="p-4 text-center text-xs text-slate-400">No matching session.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && !data && <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Loading treatment records...</div>}
      {error && !data && <div className="rounded-3xl bg-red-50 p-5 text-sm font-medium text-red-600 shadow-sm">{error}</div>}

      {data && !patientId && (
        <div className="mt-2.5 rounded-3xl bg-white p-12 text-center shadow-sm">
          <UserRound className="mx-auto text-slate-400" size={36} />
          <h2 className="mt-4 font-bold text-slate-900">Select a patient</h2>
          <p className="mt-1 text-sm text-slate-500">Search for a patient to view their latest dialysis session.</p>
        </div>
      )}

      {data && patientId && (displayedSession ? (
        <article className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
          <header className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">{displayedSessionNumber}</span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {displayedSession.session_id || "Dialysis session"}
                  {safeDisplayedIndex === 0 && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-bold text-emerald-700">Current</span>}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-500"><CalendarDays size={11} />{formatDate(displayedSession.createdAt)}</p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-600">{displayedSession.payment_type || "No coverage set"}</span>
          </header>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Detail icon={HeartPulse} label="Attending doctor" value={formatDoctorName(displayedSession.doctor) || "Not assigned"} tone="bg-emerald-100 text-emerald-700" />
              <Detail icon={Syringe} label="Injection" value={displayedSession.injections?.name} payment={displayedSession.injections?.payment_type} tone="bg-blue-100 text-blue-700" />
              <Detail icon={Circle} label="Dialyzer" value={displayedSession.dialyzer?.name} payment={displayedSession.dialyzer?.payment_type} tone="bg-violet-100 text-violet-700" />
              <Detail icon={FlaskConical} label="Intravenous iron" value={displayedSession.intravenous_iron?.name} payment={displayedSession.intravenous_iron?.payment_type} tone="bg-amber-100 text-amber-700" />
            </div>

            <div className="mt-2 min-h-0 flex-1 rounded-xl border border-blue-100/70 bg-gradient-to-br from-blue-50/50 to-slate-50 p-3">
              <div className="flex items-center justify-between"><h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900"><FlaskConical size={13} className="text-blue-600" />Laboratory results</h3><span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700">{displayedSession.laboratory_results?.length || 0} test(s)</span></div>
              {displayedSession.laboratory_results?.length ? (
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedSession.laboratory_results.map((result, index) => (
                    <div key={`${displayedSession._id}-lab-${index}`} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[10px]">
                      <span className="font-medium text-slate-700">{result.name}</span>
                      <span className="ml-auto text-sm font-bold text-black">{result.done ? "✓" : "✕"}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">No laboratory results recorded for this session.</p>}
            </div>
          </div>
        </article>
      ) : (
        <div className="mt-2.5 rounded-3xl bg-white p-12 text-center shadow-sm">
          <HeartPulse className="mx-auto text-slate-400" size={36} />
          <h2 className="mt-4 font-bold text-slate-900">No sessions recorded yet</h2>
          <p className="mt-1 text-sm text-slate-500">This patient does not have a dialysis session.</p>
        </div>
      ))}
    </div>
  );
};

export default DoctorSessionsPage;
