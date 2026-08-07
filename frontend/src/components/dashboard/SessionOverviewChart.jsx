import { useState } from "react";

const PAYMENT_TYPES = [
  { name: "PHIC", color: "#16a34a" },
  { name: "PCSO", color: "#f43f5e" },
  { name: "CASH", color: "#eab308" },
  { name: "MISC / V.A.S", color: "#6366f1" },
];

const PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "history", label: "All history" },
];

const SessionOverviewChart = ({ today = 0, byPaymentType, periods, embedded = false }) => {
  const [period, setPeriod] = useState("week");
  const paymentCounts = periods?.[period]?.byPaymentType ?? byPaymentType ?? {};
  const data = PAYMENT_TYPES.map(({ name, color }) => ({
    name,
    color,
    value: Number(paymentCounts[name]) || 0,
  }));
  const hasData = data.some((entry) => entry.value > 0);
  const total = Number(periods?.[period]?.total ?? today) || 0;
  const primaryPayer = data.reduce((highest, entry) => entry.value > highest.value ? entry : highest, { name: "None", value: 0 });

  return (
    <section className={`flex h-full min-w-0 flex-col p-3 ${embedded ? "" : "rounded-xl border border-slate-200/70 bg-white shadow-sm"}`} aria-labelledby="session-overview-title">
      <div className="flex items-start justify-between gap-2">
        <div><h2 id="session-overview-title" className="text-sm font-bold text-slate-900">Session overview</h2><p className="mt-1 text-[9px] text-slate-400">{period === "history" ? "All-time payment mix" : `Payment mix this ${period}`}</p></div>
        <label className="sr-only" htmlFor="overview-period">Overview period</label>
        <select id="overview-period" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-6 rounded-md border border-slate-200 bg-white px-1.5 text-[9px] font-bold text-slate-600 outline-none focus:border-blue-400">{PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-end justify-between"><span className="text-[9px] font-semibold text-slate-500">{period === "history" ? "All recorded sessions" : `Sessions this ${period}`}</span><strong className="text-xl leading-none text-slate-900">{total}</strong></div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
          {hasData && data.map((entry) => <span key={entry.name} title={`${entry.name}: ${entry.value}`} style={{ width: `${(entry.value / total) * 100}%`, backgroundColor: entry.color }} />)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[9px]">
          {data.map((entry) => (
            <div key={entry.name} className="rounded-lg bg-slate-50 px-2 py-1.5">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="mt-1 flex items-baseline justify-between"><strong className="text-sm leading-none text-slate-900">{entry.value}</strong><small className="text-[7px] text-slate-400">{total ? Math.round((entry.value / total) * 100) : 0}%</small></span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2 text-[8px]"><span className="font-semibold text-slate-400">Primary payment type</span><strong className="text-blue-700">{primaryPayer.name}{primaryPayer.value ? ` · ${Math.round((primaryPayer.value / total) * 100)}%` : ""}</strong></div>
    </section>
  );
};

export default SessionOverviewChart;
