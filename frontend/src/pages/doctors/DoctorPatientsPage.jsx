import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, Droplets, Search, UserRound, Users } from "lucide-react";
import Topbar from "../../components/layout/Topbar";
import { useDoctorPortalStore } from "../../store/doctorPortalStore";

const fullName = (patient) =>
  [patient?.first_name, patient?.middle_name, patient?.last_name].filter(Boolean).join(" ");

const DoctorPatientsPage = () => {
  const { data, loading, error, fetchPortal } = useDoctorPortalStore();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    fetchPortal().catch(() => {});
    const refresh = (event) => {
      if (["patients", "dialysis-sessions"].includes(event.detail?.resource)) fetchPortal().catch(() => {});
    };
    window.addEventListener("dialysave:data-changed", refresh);
    return () => window.removeEventListener("dialysave:data-changed", refresh);
  }, [fetchPortal]);

  const patients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.patients || []).filter((patient) =>
      !term ||
      fullName(patient).toLowerCase().includes(term) ||
      patient.patient_id?.toLowerCase().includes(term)
    );
  }, [data, search]);

  const selected = (data?.patients || []).find((patient) => patient._id === selectedId) || patients[0];
  const sessions = (data?.sessions || []).filter((session) => session.patient?._id === selected?._id);

  return (
    <div className="space-y-6">
      <Topbar title="My Patients" />
      {loading && !data && <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Loading assigned patients…</div>}
      {error && !data && <div className="rounded-3xl bg-red-50 p-5 text-sm font-semibold text-red-600">{error}</div>}

      {data && (
        <>
          <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{data.patients.length} assigned patient{data.patients.length === 1 ? "" : "s"}</h2>
              <p className="mt-1 text-sm text-slate-500">Only patients assigned to your doctor account are shown.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
              <Search size={17} className="text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient" className="w-60 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="max-h-[38rem] space-y-2 overflow-y-auto">
                {patients.map((patient) => {
                  const count = data.sessions.filter((session) => session.patient?._id === patient._id).length;
                  const active = selected?._id === patient._id;
                  return (
                    <button key={patient._id} onClick={() => setSelectedId(patient._id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${active ? "bg-slate-950 text-white" : "hover:bg-slate-50"}`}>
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${active ? "bg-white/10" : "bg-blue-50 text-blue-700"}`}><UserRound size={20} /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{fullName(patient)}</span>
                        <span className={`text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>{patient.patient_id} · {count} session{count === 1 ? "" : "s"}</span>
                      </span>
                    </button>
                  );
                })}
                {!patients.length && <div className="p-10 text-center text-sm text-slate-500"><Users className="mx-auto mb-3 text-slate-300" />No patients found.</div>}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                    <div><h2 className="text-xl font-extrabold text-slate-900">{fullName(selected)}</h2><p className="mt-1 text-sm text-slate-500">{selected.patient_id}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${selected.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{selected.status}</span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Blood type</p><p className="mt-1 font-bold text-slate-900">{selected.blood_type}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Gender</p><p className="mt-1 font-bold text-slate-900">{selected.gender}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Birthdate</p><p className="mt-1 font-bold text-slate-900">{new Date(selected.birthdate).toLocaleDateString("en-PH")}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Contact</p><p className="mt-1 font-bold text-slate-900">{selected.contact_number || "Not provided"}</p></div>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Recent sessions</h3><span className="text-xs font-semibold text-slate-500">{sessions.length} total</span></div>
                    <div className="mt-3 space-y-2">
                      {sessions.slice(0, 5).map((session) => (
                        <div key={session._id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><Droplets size={17} /></span>
                          <div><p className="text-sm font-bold text-slate-900">{session.session_id}</p><p className="text-xs text-slate-500"><CalendarDays className="mr-1 inline" size={12} />{new Date(session.createdAt).toLocaleString("en-PH")}</p></div>
                          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{session.payment_type}</span>
                        </div>
                      ))}
                      {!sessions.length && <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500"><Activity className="mx-auto mb-2 text-slate-300" />No dialysis sessions recorded.</div>}
                    </div>
                  </div>
                </>
              ) : <div className="grid min-h-80 place-items-center text-sm text-slate-500">Select a patient to view details.</div>}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorPatientsPage;
