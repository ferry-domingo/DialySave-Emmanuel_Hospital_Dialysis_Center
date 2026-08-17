import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Circle, FlaskConical, HeartPulse, Search, Syringe } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { formatDoctorName } from "../../utils/doctorName";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Date unavailable";

const Detail = ({ icon: Icon, label, value, payment, tone = "bg-white text-slate-500" }) => (
  <div className="min-w-0 rounded-xl border border-slate-100/80 bg-slate-50/80 p-2.5">
    <div className="flex items-start gap-2">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg shadow-sm ${tone}`}>
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-900">{value || "Not recorded"}</p>
        {payment && <p className="mt-0.5 text-[8px] text-slate-500">Coverage: {payment}</p>}
      </div>
    </div>
  </div>
);

const PatientSessionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(() => searchParams.get("session") || "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      const identifier =
        user?.patient?._id ||
        (typeof user?.patient === "string" ? user.patient : "") ||
        user?.loginId ||
        user?.id;
      if (!identifier) return;
      try {
        setLoading(true);
        setError("");
        const response = await api.get(`/patient-portal/${identifier}`);
        setSessions(response.data?.data?.sessions || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your dialysis sessions.");
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
    const handleRealtimeUpdate = (event) => {
      if (event.detail?.resource === "dialysis-sessions") loadSessions();
    };
    window.addEventListener("dialysave:data-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("dialysave:data-changed", handleRealtimeUpdate);
  }, [user]);

  const sortedSessions = useMemo(() => [...sessions].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  ), [sessions]);

  const displayedIndex = selectedId
    ? sortedSessions.findIndex((session) => String(session._id || session.session_id) === selectedId)
    : 0;

  const displayedSession = sortedSessions[displayedIndex >= 0 ? displayedIndex : 0] || null;

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    return sortedSessions
      .map((session, index) => ({ session, number: sortedSessions.length - index }))
      .filter(
        ({ session, number }) =>
          String(number).includes(term) ||
          formatDate(session.createdAt).toLowerCase().includes(term) ||
          JSON.stringify(session).toLowerCase().includes(term)
      );
  }, [search, sortedSessions]);

  const handleSelectResult = (session) => {
    setSelectedId(session._id);
    setSearch("");
  };

  return (
    <div className="min-w-0 space-y-2.5 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:overflow-hidden">

      <Topbar title="Dialysis Sessions" />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/70 px-3 py-2 shadow-sm">

        <button
          onClick={() => navigate("/patient-portal")}
          className="inline-flex h-8 items-center gap-2 rounded-xl bg-white px-3 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Back to overview
        </button>

        {sortedSessions.length > 1 && (
          <div className="relative z-30 w-full sm:w-auto">
            <div className="flex h-8 w-full items-center gap-2 rounded-xl bg-white px-3 shadow-sm sm:w-auto">
              <Search size={14} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by session # or date"
                className="min-w-0 flex-1 bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400 sm:w-48 sm:flex-none"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute right-0 left-0 z-40 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl sm:left-auto sm:w-72">
                <div className="max-h-64 overflow-y-auto py-1.5">
                  {searchResults.map(({ session, number }) => (
                    <button
                      key={session._id}
                      onClick={() => handleSelectResult(session)}
                      className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50"
                    >
                      <span className="shrink-0 font-semibold text-slate-900">Session {number}</span>
                      <span className="min-w-0 truncate text-right text-xs text-slate-500">{formatDate(session.createdAt)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {search.trim() && searchResults.length === 0 && (
              <div className="absolute right-0 left-0 z-40 mt-2 rounded-2xl border border-slate-100 bg-white p-4 text-center text-sm text-slate-400 shadow-xl sm:left-auto sm:w-72">
                No matching session.
              </div>
            )}
          </div>
        )}

      </div>

      {loading && (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          Loading treatment records…
        </div>
      )}

      {error && (
        <div className="rounded-3xl bg-red-50 p-5 text-sm font-medium text-red-600 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && (displayedSession ? (
        <article className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
          <header className="flex flex-col gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">
                {sortedSessions.length - displayedIndex}
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {displayedSession.session_id || "Dialysis session"}
                  {displayedIndex === 0 && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-bold text-emerald-700">Current</span>
                  )}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-500">
                  <CalendarDays size={11} />
                  {formatDate(displayedSession.createdAt)}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-600">
              {displayedSession.payment_type || "No coverage set"}
            </span>
          </header>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Detail
                icon={HeartPulse}
                label="Attending doctor"
                value={formatDoctorName(displayedSession.doctor) || "Not assigned"}
                tone="bg-emerald-100 text-emerald-700"
              />
              <Detail icon={Syringe} label="Injection" value={displayedSession.injections?.name} payment={displayedSession.injections?.payment_type} tone="bg-blue-100 text-blue-700" />
              <Detail icon={Circle} label="Dialyzer" value={displayedSession.dialyzer?.name} payment={displayedSession.dialyzer?.payment_type} tone="bg-violet-100 text-violet-700" />
              <Detail icon={FlaskConical} label="Intravenous iron" value={displayedSession.intravenous_iron?.name} payment={displayedSession.intravenous_iron?.payment_type} tone="bg-amber-100 text-amber-700" />
            </div>

            <div className="mt-2 min-h-0 flex-1 rounded-xl border border-blue-100/70 bg-gradient-to-br from-blue-50/50 to-slate-50 p-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900"><FlaskConical size={13} className="text-blue-600" />Laboratory results</h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700">{displayedSession.laboratory_results?.length || 0} test(s)</span>
              </div>

              {displayedSession.laboratory_results?.length ? (
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedSession.laboratory_results.map((result, resultIndex) => (
                    <div
                      key={`${displayedSession._id}-lab-${resultIndex}`}
                      className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[10px]"
                    >
                      <span className="font-medium text-slate-700">{result.name}</span>
                      <span className="ml-auto text-sm font-bold text-black">{result.done ? "✓" : "✗"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No laboratory results recorded for this session.</p>
              )}
            </div>
          </div>
        </article>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
          <HeartPulse className="mx-auto text-slate-400" size={36} />
          <h2 className="mt-4 font-bold text-slate-900">No sessions recorded yet</h2>
          <p className="mt-1 text-sm text-slate-500">Your treatment history will appear here.</p>
        </div>
      ))}
    </div>
  );
};

export default PatientSessionsPage;
