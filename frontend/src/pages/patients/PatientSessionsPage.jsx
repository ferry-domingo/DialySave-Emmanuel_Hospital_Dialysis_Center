import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Circle, FlaskConical, HeartPulse, Search, Syringe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Date unavailable";

const Detail = ({ icon: Icon, label, value, payment }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 font-semibold text-slate-900">{value || "Not recorded"}</p>
        {payment && <p className="mt-1 text-xs text-slate-500">Coverage: {payment}</p>}
      </div>
    </div>
  </div>
);

const PatientSessionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
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
    ? sortedSessions.findIndex((s) => s._id === selectedId)
    : 0;

  const displayedSession = sortedSessions[displayedIndex >= 0 ? displayedIndex : 0] || null;

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    return sortedSessions
      .map((session, index) => ({ session, number: sortedSessions.length - index }))
      .filter(
        ({ session, number }) =>
          String(number).includes(term) || formatDate(session.createdAt).toLowerCase().includes(term)
      );
  }, [search, sortedSessions]);

  const handleSelectResult = (session) => {
    setSelectedId(session._id);
    setSearch("");
  };

  return (
    <div className="space-y-6">

      <Topbar title="Dialysis Sessions" />

      <div className="flex flex-wrap items-center justify-between gap-3">

        <button
          onClick={() => navigate("/patient-portal")}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Back to overview
        </button>

        {sortedSessions.length > 1 && (
          <div className="relative">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by session # or date"
                className="w-56 bg-transparent text-sm text-black outline-none placeholder:text-slate-400"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute right-0 z-10 mt-2 w-72 overflow-hidden rounded-2xl bg-white shadow-lg">
                <div className="max-h-64 overflow-y-auto py-1.5">
                  {searchResults.map(({ session, number }) => (
                    <button
                      key={session._id}
                      onClick={() => handleSelectResult(session)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50"
                    >
                      <span className="font-semibold text-slate-900">Session {number}</span>
                      <span className="text-xs text-slate-500">{formatDate(session.createdAt)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {search.trim() && searchResults.length === 0 && (
              <div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl bg-white p-4 text-center text-sm text-slate-400 shadow-lg">
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
        <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 font-bold text-white">
                {sortedSessions.length - displayedIndex}
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {displayedSession.session_id || "Dialysis session"}
                  {displayedIndex === 0 && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Current</span>
                  )}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <CalendarDays size={14} />
                  {formatDate(displayedSession.createdAt)}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              {displayedSession.payment_type || "No coverage set"}
            </span>
          </header>

          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Detail
                icon={HeartPulse}
                label="Attending doctor"
                value={displayedSession.doctor ? `${displayedSession.doctor.first_name || ""} ${displayedSession.doctor.last_name || ""}`.trim() : "Not assigned"}
              />
              <Detail icon={Syringe} label="Injection" value={displayedSession.injections?.name} payment={displayedSession.injections?.payment_type} />
              <Detail icon={Circle} label="Dialyzer" value={displayedSession.dialyzer?.name} payment={displayedSession.dialyzer?.payment_type} />
              <Detail icon={FlaskConical} label="Intravenous iron" value={displayedSession.intravenous_iron?.name} payment={displayedSession.intravenous_iron?.payment_type} />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Laboratory results</h3>
                <span className="text-xs font-medium text-slate-500">{displayedSession.laboratory_results?.length || 0} test(s)</span>
              </div>

              {displayedSession.laboratory_results?.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedSession.laboratory_results.map((result, resultIndex) => (
                    <div
                      key={`${displayedSession._id}-lab-${resultIndex}`}
                      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm"
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
