import { useEffect, useState } from "react";
import { CalendarDays, IdCard, Printer, Search, UserRound } from "lucide-react";

import AgreementItemsCovered from "../../components/monitoring/AgreementItemsCovered";
import AgreementSignature from "../../components/monitoring/AgreementSignature";
import AgreementPrintDocument from "../../components/monitoring/AgreementPrintDocument";

import { useMonitoringStore } from "../../store/monitoringStore";
import { useAuthStore } from "../../store/authStore";

const formatSessionDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const MonitoringAgreement = ({ agreement, patientId }) => {

  const [selectedSession, setSelectedSession] = useState(0);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { setAgreementHeparin } = useMonitoringStore();
  const user = useAuthStore((state) => state.user);

  const handlePrint = () => {
    const pageStyle = document.createElement("style");
    pageStyle.dataset.agreementPrint = "true";
    pageStyle.textContent = "@media print { @page { size: A4 portrait; margin: 0 0.6in; } }";
    document.head.appendChild(pageStyle);

    const cleanup = () => pageStyle.remove();
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  useEffect(() => {
    if (agreement?.sessions?.length) {
      setSelectedSession(agreement.sessions.length - 1);
    }
    setSearch("");
    setSearchOpen(false);
  }, [patientId, agreement?.sessions?.length]);

  if (!agreement || agreement.sessions.length === 0) {
    return <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">No Agreement Available</div>;
  }

  const selectedIndex = Math.min(selectedSession, agreement.sessions.length - 1);
  const session = agreement.sessions[selectedIndex];
  const isCurrent = selectedIndex === agreement.sessions.length - 1;

  const handleHeparinChange = (sessionId, heparin) => {
    setAgreementHeparin(sessionId, heparin);
  };

  const filteredResults = agreement.sessions
    .map((s, index) => ({ session: s, index }))
    .filter(({ session: s }) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return (
        String(s.sessionNo).includes(term) ||
        `session ${s.sessionNo}`.includes(term) ||
        formatSessionDate(s.date).toLowerCase().includes(term) ||
        JSON.stringify(s).toLowerCase().includes(term)
      );
    });

  const handlePick = (index) => {
    setSelectedSession(index);
    setSearch("");
    setSearchOpen(false);
  };

  return (

    <div className="space-y-3">

      <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2 shadow-sm">

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-950 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm">
            Session {session.sessionNo}
          </span>
          {isCurrent && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Current</span>
          )}

          <span className="hidden h-5 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
            <CalendarDays size={12} className="text-blue-500" />
            <span className="text-[8px] font-semibold uppercase text-slate-400">Date</span>
            <b className="text-[10px] text-slate-800">{formatSessionDate(session.date)}</b>
          </div>

          <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
            <UserRound size={12} className="shrink-0 text-emerald-600" />
            <span className="text-[8px] font-semibold uppercase text-slate-400">Patient</span>
            <b className="max-w-40 truncate text-[10px] text-slate-800">{session.patient?.full_name || "—"}</b>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
            <IdCard size={12} className="text-violet-500" />
            <span className="text-[8px] font-semibold uppercase text-slate-400">ID</span>
            <b className="text-[10px] text-slate-800">{session.patient?.patient_id || "—"}</b>
          </div>

          <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
            <span className="text-[8px] font-semibold uppercase text-slate-400">Representative</span>
            <b className="max-w-40 truncate text-[10px] text-slate-800">{user?.username || "—"}</b>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <div className="relative">
            <div className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 focus-within:border-slate-400">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setSearchOpen(false)}
                placeholder="Search session # or date"
                aria-label="Search agreement sessions"
                aria-expanded={searchOpen}
                className="w-44 bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400"
              />
            </div>

            {searchOpen && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                className="absolute right-0 z-30 mt-2 max-h-64 w-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl"
              >
                {filteredResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">No matching session.</p>
                ) : (
                  filteredResults.map(({ session: s, index }) => (
                    <button
                      key={s.sessionId}
                      type="button"
                      onClick={() => handlePick(index)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                        index === selectedIndex ? "bg-slate-50" : ""
                      }`}
                    >
                      <span className="font-semibold text-slate-900">
                        Session {s.sessionNo}
                        {index === agreement.sessions.length - 1 && (
                          <span className="ml-1.5 text-[10px] font-bold uppercase text-emerald-600">Current</span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500">{formatSessionDate(s.date)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-[10px] font-semibold text-white transition hover:bg-slate-800"
          >
            <Printer size={16} />
            Print
          </button>

        </div>

      </div>

      <div className="no-print space-y-3">
        <AgreementItemsCovered session={session} onHeparinChange={handleHeparinChange} />
        <AgreementSignature session={session} />
      </div>

      <div className="print-page agreement-monitoring-print">
        <AgreementPrintDocument session={session} />
      </div>

    </div>

  );

};

export default MonitoringAgreement;
