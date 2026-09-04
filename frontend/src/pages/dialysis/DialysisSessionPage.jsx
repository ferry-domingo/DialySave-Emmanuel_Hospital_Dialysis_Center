import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Printer, Search } from "lucide-react";

import Modal from "../../components/common/Modal";
import Topbar from "../../components/layout/Topbar";

import DialysisSessionForm from "../../components/forms/DialysisSessionForm";
import DialysisSessionTable from "./DialysisSessionTable";

import { useDialysisSessionStore } from "../../store/dialysisSessionStore";

const toLocalDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayKey = () => toLocalDateKey(new Date());

const DialysisSessionPage = () => {
  const {
    sessions,
    loading,
    fetchSessions,
  } = useDialysisSessionStore();

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => todayKey());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => todayKey().slice(0, 7));
  const [calendarView, setCalendarView] = useState("day");
  const [yearWindowStart, setYearWindowStart] = useState(() => new Date().getFullYear() - 2);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const [openModal, setOpenModal] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filteredSessions = sessions.filter((session) => {
    if (selectedDate && toLocalDateKey(session.createdAt) !== selectedDate) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return JSON.stringify([
      session,
      session.patient,
      session.doctor,
      session.injections,
      session.dialyzer,
      session.intravenous_iron,
      session.laboratory_request?.filter((result) => result.done).map((result) => result.name),
    ]).toLowerCase().includes(term);
  });

  const currentDateLabel = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const selectedDateLabel = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${selectedDate}T00:00:00`));

  const sessionDateCounts = sessions.reduce((counts, session) => {
    const key = toLocalDateKey(session.createdAt);
    if (key) counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  const [calendarYear, calendarMonthNumber] = calendarMonth.split("-").map(Number);
  const firstWeekday = new Date(calendarYear, calendarMonthNumber - 1, 1).getDay();
  const daysInCalendarMonth = new Date(calendarYear, calendarMonthNumber, 0).getDate();
  const calendarDays = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInCalendarMonth }, (_, index) => index + 1),
  ];

  const changeCalendarMonth = (offset) => {
    const next = new Date(calendarYear, calendarMonthNumber - 1 + offset, 1);
    setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  };

  const selectToday = () => {
    const today = todayKey();
    setSelectedDate(today);
    setCalendarMonth(today.slice(0, 7));
    setCalendarOpen(false);
  };

  const handlePrint = () => {
    const pageStyle = document.createElement("style");
    pageStyle.textContent = "@media print { @page { size: A4 landscape; margin: 0 0.2in; } }";
    document.head.appendChild(pageStyle);
    const cleanup = () => pageStyle.remove();
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  return (
    <div className="space-y-3">

      <Topbar title="Dialysis Sessions" />

      <div className="no-print flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm lg:flex-row lg:items-center lg:justify-between">

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-48">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search session..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex min-w-0 items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCalendarOpen((open) => {
                    const next = !open;
                    if (next) setCalendarView("day");
                    return next;
                  });
                }}
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-[9px] font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                aria-label="Select session date"
                aria-expanded={calendarOpen}
              >
                <CalendarDays size={12} className="text-blue-600" />
                {selectedDateLabel}
              </button>

              {calendarOpen && (
                <div className="absolute left-0 top-9 z-40 w-64 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl">
                  {calendarView === "year" ? (
                    <>
                      <div className="mb-2 text-center text-[11px] font-extrabold uppercase text-slate-700">Select Year</div>
                      <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[18px] font-bold text-slate-800">{calendarYear}</div>
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 px-2 py-1.5">
                          <button type="button" onClick={() => setYearWindowStart((value) => value - 12)} className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-slate-100" aria-label="Previous year set">
                            <ChevronLeft size={13} />
                          </button>
                          <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-700">{yearWindowStart} - {yearWindowStart + 11}</span>
                          <button type="button" onClick={() => setYearWindowStart((value) => value + 12)} className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-slate-100" aria-label="Next year set">
                            <ChevronRight size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-0">
                          {Array.from({ length: 12 }, (_, index) => yearWindowStart + index).map((year) => {
                            const isSelected = year === calendarYear;
                            return (
                              <button
                                key={year}
                                type="button"
                                onClick={() => {
                                  setCalendarMonth(`${year}-${String(calendarMonthNumber).padStart(2, "0")}`);
                                  setCalendarView("month");
                                }}
                                className={`h-11 border border-slate-200 text-[16px] font-semibold text-slate-700 transition ${isSelected ? "bg-emerald-50 text-emerald-600" : "bg-white hover:bg-slate-50"}`}
                              >
                                {year}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : calendarView === "month" ? (
                    <>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setCalendarView("year")}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-extrabold uppercase text-slate-700"
                          aria-label="Select year"
                        >
                          {calendarYear}
                        </button>
                        <div className="flex-1 text-center text-[11px] font-extrabold uppercase text-slate-700">Select Month</div>
                      </div>
                      <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[16px] font-bold text-slate-800">{monthNames[calendarMonthNumber - 1]}</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {monthNames.map((month, index) => {
                          const monthNumber = index + 1;
                          const isSelected = monthNumber === calendarMonthNumber;
                          return (
                            <button
                              key={month}
                              type="button"
                              onClick={() => {
                                setCalendarMonth(`${calendarYear}-${String(monthNumber).padStart(2, "0")}`);
                                setCalendarView("day");
                              }}
                              className={`rounded-lg border px-2 py-2 text-[12px] font-semibold transition ${isSelected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                            >
                              {month.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between gap-1">
                        <button type="button" onClick={() => changeCalendarMonth(-1)} className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-slate-100" aria-label="Previous month">
                          <ChevronLeft size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalendarView("month")}
                          className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-center text-[10px] font-extrabold uppercase text-slate-800"
                          aria-label="Select month"
                        >
                          {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(calendarYear, calendarMonthNumber - 1, 1))}
                        </button>
                        <button type="button" onClick={() => changeCalendarMonth(1)} className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-slate-100" aria-label="Next month">
                          <ChevronRight size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 text-center">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                          <span key={`${day}-${index}`} className="py-1 text-[7px] font-bold text-slate-400">{day}</span>
                        ))}
                        {calendarDays.map((day, index) => {
                          if (!day) return <span key={`blank-${index}`} />;
                          const dateKey = `${calendarMonth}-${String(day).padStart(2, "0")}`;
                          const hasSessions = Boolean(sessionDateCounts[dateKey]);
                          const isSelected = dateKey === selectedDate;
                          const isToday = dateKey === todayKey();
                          return (
                            <button
                              key={dateKey}
                              type="button"
                              title={hasSessions ? `${sessionDateCounts[dateKey]} dialysis session${sessionDateCounts[dateKey] > 1 ? "s" : ""}` : "No dialysis sessions"}
                              onClick={() => {
                                setSelectedDate(dateKey);
                                setCalendarOpen(false);
                              }}
                              className={`relative grid h-6 place-items-center rounded text-[8px] font-bold transition ${isSelected ? "bg-blue-600 text-white" : hasSessions ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "text-slate-500 hover:bg-slate-100"} ${isToday && !isSelected ? "ring-1 ring-blue-400" : ""}`}
                            >
                              {day}
                              {hasSessions && <span className={`absolute bottom-0.5 h-0.5 w-2 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1.5 text-[8px] font-bold text-blue-700">
              TODAY · {currentDateLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={() => {
              setSelectedSession(null);
              setOpenModal(true);
            }}
            className="flex items-center justify-center gap-1 rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={14} />
            Add Session
          </button>
        </div>

      </div>

      <DialysisSessionTable
        sessions={filteredSessions}
        loading={loading}
        onEdit={(session) => {
          setSelectedSession(session);
          setOpenModal(true);
        }}
      />

      <Modal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedSession(null);
        }}
        maxWidth="max-w-3xl"
        title={
          selectedSession
            ? "Update Dialysis Session"
            : "Add Dialysis Session"
        }
      >
        <DialysisSessionForm
          session={selectedSession}
          onClose={() => {
            setOpenModal(false);
            setSelectedSession(null);
          }}
        />
      </Modal>

    </div>
  );
};

export default DialysisSessionPage;
