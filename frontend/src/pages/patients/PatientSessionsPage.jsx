import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Circle, FlaskConical, HeartPulse, Search, Syringe } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { formatDoctorName } from "../../utils/doctorName";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Date unavailable";

const formatDateOnly = (value) => value
  ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value))
  : "Date unavailable";

const formatDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  const [selectedDate, setSelectedDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => formatDateInputValue(new Date()).slice(0, 7));

  useEffect(() => {
    const loadSessions = async (silent = false) => {
      const identifier =
        user?.patient?._id ||
        (typeof user?.patient === "string" ? user.patient : "") ||
        user?.loginId ||
        user?.id;
      if (!identifier) return;
      try {
        if (!silent) setLoading(true);
        setError("");
        const response = await api.get(`/patient-portal/${identifier}`);
        setSessions(response.data?.data?.sessions || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your dialysis sessions.");
      } finally {
        if (!silent) setLoading(false);
      }
    };
    loadSessions();
    const handleRealtimeUpdate = (event) => {
      if (event.detail?.resource === "dialysis-sessions") loadSessions(true);
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

  const sessionDateCounts = useMemo(() => sessions.reduce((counts, session) => {
    const key = formatDateInputValue(session.createdAt);
    if (key) counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}), [sessions]);

  const [calendarYear, calendarMonthNumber] = calendarMonth.split("-").map(Number);
  const firstWeekday = new Date(calendarYear, calendarMonthNumber - 1, 1).getDay();
  const daysInCalendarMonth = new Date(calendarYear, calendarMonthNumber, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInCalendarMonth }, (_, index) => index + 1),
  ];
  const sessionYears = sessions
    .map((session) => new Date(session.createdAt).getFullYear())
    .filter(Number.isFinite);
  const currentYear = new Date().getFullYear();
  const firstCalendarYear = Math.min(currentYear, ...sessionYears) - 2;
  const lastCalendarYear = Math.max(currentYear, ...sessionYears) + 2;
  const calendarYears = Array.from(
    { length: lastCalendarYear - firstCalendarYear + 1 },
    (_, index) => firstCalendarYear + index
  );

  const changeCalendarMonth = (offset) => {
    const nextMonth = new Date(calendarYear, calendarMonthNumber - 1 + offset, 1);
    setCalendarMonth(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`);
  };

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

  const handleDateChange = (value) => {
    setSelectedDate(value);
    setDateError("");
    setCalendarOpen(false);
    if (!value) return;

    const matchingSession = sortedSessions.find(
      (session) => formatDateInputValue(session.createdAt) === value
    );
    if (matchingSession) {
      setSelectedId(String(matchingSession._id || matchingSession.session_id));
      setSearch("");
    } else {
      setDateError("No dialysis session on this date.");
    }
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
          <div className="relative z-30 grid w-full grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-2 sm:flex sm:w-auto">
            <div className="relative order-2 min-w-0">
              <button
                type="button"
                onClick={() => setCalendarOpen((open) => !open)}
                className="relative flex h-8 w-full min-w-0 items-center justify-center rounded-xl bg-white px-7 text-center shadow-sm sm:w-40"
                aria-label="Choose dialysis date"
                aria-expanded={calendarOpen}
              >
                <CalendarDays size={13} className="absolute left-3 shrink-0 text-emerald-600" />
                <span className="w-full truncate text-center text-[11px] font-semibold text-slate-700">
                  {selectedDate ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${selectedDate}T00:00:00`)) : "Select date"}
                </span>
              </button>

              {calendarOpen && (
                <div className="absolute right-0 top-10 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl">
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <button type="button" onClick={() => changeCalendarMonth(-1)} className="grid h-6 w-6 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Previous month"><ChevronLeft size={13} /></button>
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
                      <select
                        value={calendarMonthNumber}
                        onChange={(event) => setCalendarMonth(`${calendarYear}-${String(event.target.value).padStart(2, "0")}`)}
                        className="w-28 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-800 outline-none focus:border-emerald-400"
                        aria-label="Select month"
                      >
                        {MONTH_NAMES.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                      </select>
                      <select
                        value={calendarYear}
                        onChange={(event) => setCalendarMonth(`${event.target.value}-${String(calendarMonthNumber).padStart(2, "0")}`)}
                        className="w-16 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-center text-[10px] font-semibold text-slate-800 outline-none focus:border-emerald-400"
                        aria-label="Select year"
                      >
                        {calendarYears.map((year) => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={() => changeCalendarMonth(1)} className="grid h-6 w-6 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Next month"><ChevronRight size={13} /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`} className="py-1 text-[8px] font-bold text-slate-400">{day}</span>)}
                    {calendarDays.map((day, index) => {
                      if (!day) return <span key={`blank-${index}`} />;
                      const dateKey = `${calendarMonth}-${String(day).padStart(2, "0")}`;
                      const hasSessions = Boolean(sessionDateCounts[dateKey]);
                      const isSelected = selectedDate === dateKey;
                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => handleDateChange(dateKey)}
                          title={hasSessions ? `${sessionDateCounts[dateKey]} dialysis session${sessionDateCounts[dateKey] > 1 ? "s" : ""}` : "No dialysis session"}
                          className={`relative grid h-7 place-items-center rounded-lg text-[9px] font-bold transition ${isSelected ? "bg-blue-600 text-white" : hasSessions ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "text-slate-500 hover:bg-slate-100"}`}
                        >
                          {day}
                          {hasSessions && <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1 text-[8px] text-slate-500"><i className="h-2 w-2 rounded-full bg-emerald-500" /> May session</span>
                    {selectedDate && <button type="button" onClick={() => handleDateChange("")} className="text-[9px] font-semibold text-slate-500 hover:text-slate-800">Clear</button>}
                  </div>
                </div>
              )}
            </div>

            <div className="relative order-1 min-w-0 sm:w-auto">
              <div className="flex h-8 w-full items-center gap-2 rounded-xl bg-white px-3 shadow-sm sm:w-auto">
                <Search size={14} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search session # or date"
                  className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-xs placeholder:font-medium placeholder:text-slate-400 sm:w-48 sm:flex-none"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="absolute left-0 z-40 mt-2 w-60 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                  <div className="max-h-64 overflow-y-auto py-1.5">
                    {searchResults.map(({ session, number }) => (
                      <button
                        key={session._id}
                        onClick={() => handleSelectResult(session)}
                        className="flex w-full min-w-0 items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50"
                      >
                        <span className="shrink-0 text-xs font-semibold text-slate-900">Session {number}</span>
                        <span className="whitespace-nowrap text-right text-[11px] font-medium text-slate-500">{formatDateOnly(session.createdAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {search.trim() && searchResults.length === 0 && (
                <div className="absolute left-0 z-40 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-100 bg-white p-4 text-center text-[10px] text-slate-400 shadow-xl">
                  No matching session.
                </div>
              )}
            </div>

            {dateError && (
              <div className="col-span-2 rounded-xl bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-700 sm:absolute sm:right-0 sm:top-9 sm:w-72">
                {dateError}
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
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900"><FlaskConical size={13} className="text-blue-600" />Laboratory request</h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700">{displayedSession.laboratory_request?.length || 0} test(s)</span>
              </div>

              {displayedSession.laboratory_request?.length ? (
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedSession.laboratory_request.map((result, resultIndex) => (
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
                <p className="mt-3 text-sm text-slate-500">No laboratory request recorded for this session.</p>
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
