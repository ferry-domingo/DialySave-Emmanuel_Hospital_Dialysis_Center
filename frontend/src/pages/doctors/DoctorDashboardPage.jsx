import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Droplets,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import api from "../../api/axios";
import Topbar from "../../components/layout/Topbar";
import { Link } from "react-router-dom";

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

const patientName = (patient) =>
  [patient?.first_name, patient?.middle_name, patient?.last_name].filter(Boolean).join(" ");

const StatCard = ({ icon: Icon, label, value, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-950 text-white",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={20} /></span>
      <p className="mt-4 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
};

const DoctorDashboardPage = () => {
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
    return (data?.patients || []).filter((patient) =>
      !term || patientName(patient).toLowerCase().includes(term) || patient.patient_id?.toLowerCase().includes(term)
    );
  }, [data, search]);

  const sessions = useMemo(() => (data?.sessions || []).filter((session) =>
    !selectedPatient || session.patient?._id === selectedPatient
  ), [data, selectedPatient]);

  const selected = data?.patients?.find((patient) => patient._id === selectedPatient);

  return (
    <div className="space-y-6">
      <Topbar title="Doctor Dashboard" />

      {loading && <div className="rounded-3xl bg-white p-12 text-center text-sm text-slate-500 shadow-sm">Loading your assigned patients…</div>}
      {error && <div className="rounded-3xl bg-red-50 p-6 text-sm font-semibold text-red-600 shadow-sm">{error}</div>}

      {!loading && !error && data && (
        <>
          <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-400">Welcome back</p>
                <h2 className="mt-1 text-2xl font-extrabold">Dr. {patientName(data.doctor)}</h2>
                <p className="mt-2 text-sm text-slate-300">Doctor ID: {data.doctor.doctor_id}</p>
              </div>
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10"><Stethoscope size={30} /></span>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Users} label="Assigned patients" value={data.summary.patientCount} />
            <StatCard icon={Activity} label="Total dialysis sessions" value={data.summary.sessionCount} tone="blue" />
            <StatCard icon={CalendarDays} label="Sessions this month" value={data.summary.sessionsThisMonth} tone="emerald" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/doctor-patients" className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Users size={21} /></span>
              <span><span className="block font-extrabold text-slate-900">View all assigned patients</span><span className="mt-1 block text-sm text-slate-500">Profiles, medical details, and recent sessions</span></span>
              <ChevronRight className="ml-auto text-slate-300 transition group-hover:translate-x-1" />
            </Link>
            <Link to="/doctor-sessions" className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Activity size={21} /></span>
              <span><span className="block font-extrabold text-slate-900">Review dialysis sessions</span><span className="mt-1 block text-sm text-slate-500">Treatment details, supplies, and laboratory status</span></span>
              <ChevronRight className="ml-auto text-slate-300 transition group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">My Patients</h2>
                  <p className="mt-1 text-xs text-slate-500">Patients currently assigned to you</p>
                </div>
                {selectedPatient && <button onClick={() => setSelectedPatient("")} className="text-xs font-bold text-blue-600">Show all</button>}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3.5 py-3">
                <Search size={16} className="text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or patient ID" className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
              </div>
              <div className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto">
                {patients.map((patient) => (
                  <button key={patient._id} onClick={() => setSelectedPatient(patient._id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selectedPatient === patient._id ? "bg-slate-950 text-white" : "hover:bg-slate-50"}`}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selectedPatient === patient._id ? "bg-white/10" : "bg-slate-100 text-slate-600"}`}><CircleUserRound size={19} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{patientName(patient)}</span>
                      <span className={`block text-xs ${selectedPatient === patient._id ? "text-slate-300" : "text-slate-500"}`}>{patient.patient_id} · {patient.blood_type}</span>
                    </span>
                    <ChevronRight size={16} className="ml-auto shrink-0 opacity-50" />
                  </button>
                ))}
                {!patients.length && <p className="p-6 text-center text-sm text-slate-500">No assigned patients found.</p>}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-bold text-slate-900">{selected ? `${patientName(selected)}'s Sessions` : "Dialysis Sessions"}</h2>
                <p className="mt-1 text-xs text-slate-500">{selected ? `${selected.patient_id} · ${selected.blood_type} blood type` : "Complete session history for your assigned patients"}</p>
              </div>
              <div className="mt-4 space-y-3">
                {sessions.map((session) => (
                  <article key={session._id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Droplets size={18} /></span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{session.session_id}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{patientName(session.patient)} · {session.patient?.patient_id}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{session.payment_type || "Not set"}</span>
                    </div>
                    <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:grid-cols-2">
                      <span><b className="text-slate-700">Date:</b> {formatDate(session.createdAt)}</span>
                      <span><b className="text-slate-700">Labs:</b> {session.laboratory_results?.filter((lab) => lab.done).length || 0}/{session.laboratory_results?.length || 0} completed</span>
                      <span><b className="text-slate-700">Injection:</b> {session.injections?.name || "Not recorded"}</span>
                      <span><b className="text-slate-700">Dialyzer:</b> {session.dialyzer?.name || "Not recorded"}</span>
                    </div>
                  </article>
                ))}
                {!sessions.length && <div className="rounded-2xl bg-slate-50 p-10 text-center"><Activity className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-600">No dialysis sessions found.</p></div>}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorDashboardPage;
