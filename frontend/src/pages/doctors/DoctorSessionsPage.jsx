import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, Check, Circle, FlaskConical, Search, Syringe, X } from "lucide-react";
import Topbar from "../../components/layout/Topbar";
import { useDoctorPortalStore } from "../../store/doctorPortalStore";
import { formatDoctorName } from "../../utils/doctorName";

const fullName = (patient) =>
  [patient?.first_name, patient?.middle_name, patient?.last_name].filter(Boolean).join(" ");

const doctorName = (doctor) => formatDoctorName(doctor);

const DoctorSessionsPage = () => {
  const { data, loading, error, fetchPortal } = useDoctorPortalStore();
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");

  useEffect(() => {
    fetchPortal().catch(() => {});
    const refresh = (event) => {
      if (event.detail?.resource === "dialysis-sessions") fetchPortal().catch(() => {});
    };
    window.addEventListener("dialysave:data-changed", refresh);
    return () => window.removeEventListener("dialysave:data-changed", refresh);
  }, [fetchPortal]);

  const sessions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sessionNumbers = new Map();
    const patientCounts = new Map();

    [...(data?.sessions || [])]
      .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))
      .forEach((session) => {
        const key = session.patient?._id || "unknown";
        const number = (patientCounts.get(key) || 0) + 1;
        patientCounts.set(key, number);
        sessionNumbers.set(session._id, number);
      });

    return (data?.sessions || [])
      .map((session) => ({ ...session, sessionNumber: sessionNumbers.get(session._id) || 1 }))
      .filter((session) =>
        (!patientId || session.patient?._id === patientId) &&
        (!term ||
          session.session_id?.toLowerCase().includes(term) ||
          fullName(session.patient).toLowerCase().includes(term) ||
          String(session.sessionNumber) === term ||
          `session ${session.sessionNumber}`.includes(term) ||
          `#${session.sessionNumber}` === term ||
          JSON.stringify(session).toLowerCase().includes(term))
      );
  }, [data, patientId, search]);

  return (
    <div className="space-y-6">
      <Topbar title="Patient Sessions" />
      {loading && !data && <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Loading dialysis sessions…</div>}
      {error && !data && <div className="rounded-3xl bg-red-50 p-5 text-sm font-semibold text-red-600">{error}</div>}
      {data && (
        <>
          <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-lg font-extrabold text-slate-900">{sessions.length} session{sessions.length === 1 ? "" : "s"}</h2><p className="text-sm text-slate-500">All sessions for assigned patients plus your historical attending sessions.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="rounded-2xl border-0 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
                <option value="">All visible patients</option>
                {Array.from(
                  new Map(data.sessions.filter((session) => session.patient?._id).map((session) => [session.patient._id, session.patient])).values()
                ).map((patient) => <option key={patient._id} value={patient._id}>{fullName(patient)}</option>)}
              </select>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3"><Search size={16} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Session #, ID, or patient" className="bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" /></div>
            </div>
          </div>
          <div className="space-y-3">
            {sessions.map((session) => (
              <article key={session._id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3"><span className="grid h-11 min-w-11 place-items-center rounded-2xl bg-slate-950 px-2 text-sm font-extrabold text-white">#{session.sessionNumber}</span><div><h3 className="font-extrabold text-slate-900">Session {session.sessionNumber} <span className="ml-1 text-xs font-semibold text-slate-400">{session.session_id}</span></h3><p className="text-sm text-slate-500">{fullName(session.patient)} · {session.patient?.patient_id}</p></div></div>
                  <div className="text-right"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{session.payment_type || "Not set"}</span><p className="mt-2 text-xs text-slate-500"><CalendarDays className="mr-1 inline" size={12} />{new Date(session.createdAt).toLocaleString("en-PH")}</p></div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-3"><Syringe size={16} className="text-slate-400" /><p className="mt-2 text-xs font-bold uppercase text-slate-400">Injection</p><p className="mt-1 text-sm font-semibold text-slate-800">{session.injections?.name || "Not recorded"}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><Circle size={16} className="text-slate-400" /><p className="mt-2 text-xs font-bold uppercase text-slate-400">Dialyzer</p><p className="mt-1 text-sm font-semibold text-slate-800">{session.dialyzer?.name || "Not recorded"}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><FlaskConical size={16} className="text-slate-400" /><p className="mt-2 text-xs font-bold uppercase text-slate-400">IV iron</p><p className="mt-1 text-sm font-semibold text-slate-800">{session.intravenous_iron?.name || "Not recorded"}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><FlaskConical size={16} className="text-slate-400" /><p className="mt-2 text-xs font-bold uppercase text-slate-400">Laboratory</p><p className="mt-1 text-sm font-semibold text-slate-800">{session.laboratory_results?.filter((lab) => lab.done).length || 0}/{session.laboratory_results?.length || 0} completed</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Attending doctor: <span className="font-semibold text-slate-700">{doctorName(session.doctor) || "Not recorded"}</span></p>
                <details className="mt-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700">View complete session details</summary>
                  <div className="space-y-4 border-t border-slate-200 p-4">
                    {session.reason && (
                      <div><p className="text-xs font-bold uppercase text-slate-400">Treatment reason</p><p className="mt-1 text-sm text-slate-700">{session.reason}</p></div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold uppercase text-slate-400">Injection coverage</p><p className="mt-1 text-sm font-semibold text-slate-700">{session.injections?.payment_type || "Not recorded"}</p></div>
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold uppercase text-slate-400">Dialyzer coverage</p><p className="mt-1 text-sm font-semibold text-slate-700">{session.dialyzer?.payment_type || "Not recorded"}</p></div>
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold uppercase text-slate-400">IV iron coverage</p><p className="mt-1 text-sm font-semibold text-slate-700">{session.intravenous_iron?.payment_type || "Not recorded"}</p></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Laboratory results</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {session.laboratory_results?.map((lab, index) => (
                          <div key={`${session._id}-lab-${index}`} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
                            <span className={`inline-grid h-6 w-6 shrink-0 place-items-center rounded-full ${lab.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                              {lab.done ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                            </span>
                            <span className="text-sm font-semibold text-slate-700">{lab.name}</span>
                          </div>
                        ))}
                        {!session.laboratory_results?.length && <span className="text-sm text-slate-500">No laboratory results recorded.</span>}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold uppercase text-slate-400">Heparin</p><p className="mt-1 text-sm font-semibold text-slate-700">{session.agreement?.heparin || "Not recorded"}</p></div>
                  </div>
                </details>
              </article>
            ))}
            {!sessions.length && <div className="rounded-3xl bg-white p-12 text-center shadow-sm"><Activity className="mx-auto text-slate-300" size={36} /><h3 className="mt-3 font-bold text-slate-800">No matching sessions</h3><p className="mt-1 text-sm text-slate-500">Sessions with your patients will appear here.</p></div>}
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorSessionsPage;
