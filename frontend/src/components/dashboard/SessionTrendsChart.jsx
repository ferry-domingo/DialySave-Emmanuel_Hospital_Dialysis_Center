import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const formatTooltip = (value) => [`${value} session${value === 1 ? "" : "s"}`, "Sessions"];

const PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "history", label: "All history" },
];
const EMPTY_PERIODS = {
  month: Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, index) => ({ day: String(index + 1), count: 0 })),
  year: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((day) => ({ day, count: 0 })),
};
const PERIOD_LABELS = {
  week: "Monday–Sunday",
  month: `1–${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`,
  year: "Jan–Dec",
  history: "By year",
};

const SessionTrendsChart = ({ data = [], periods, embedded = false }) => {
  const [period, setPeriod] = useState("week");
  const selectedData = periods?.[period]?.trends ?? (period === "week" ? data : EMPTY_PERIODS[period]);
  const chartData = Array.isArray(selectedData)
    ? selectedData.map((entry) => ({
      day: entry?.day ?? "",
      count: Number(entry?.count) || 0,
    }))
    : [];
  const total = chartData.reduce((sum, entry) => sum + entry.count, 0);
  const activePeriods = chartData.filter((entry) => entry.count > 0).length;
  const peak = chartData.reduce((highest, entry) => entry.count > highest.count ? entry : highest, { day: "—", count: 0 });
  const average = chartData.length ? (total / chartData.length).toFixed(1) : "0.0";
  const averageUnit = period === "week" || period === "month" ? "day" : period === "year" ? "month" : "year";

  return (
    <section className={`flex h-full min-w-0 flex-col p-3 ${embedded ? "" : "rounded-xl border border-slate-200/70 bg-white shadow-sm"}`} aria-labelledby="session-trends-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="session-trends-title" className="text-sm font-bold text-slate-900">Session trends</h2>
          <p className="mt-1 text-[10px] text-slate-400">{period === "history" ? "Sessions across all recorded years" : `Sessions recorded this ${period}`} <span className="font-bold text-blue-600">· {PERIOD_LABELS[period]}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="trend-period">Trend period</label>
          <select id="trend-period" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-6 rounded-md border border-slate-200 bg-white px-1.5 text-[9px] font-bold capitalize text-slate-600 outline-none focus:border-blue-400">
            {PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <div className="text-right"><p className="text-lg font-extrabold leading-none text-emerald-700">{periods?.[period]?.total ?? total}</p><p className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-slate-400">sessions</p></div>
        </div>
      </div>

      <div className="mt-1.5 h-32 min-w-0 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -14, bottom: 14 }}>
            <defs><linearGradient id="sessionTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              interval={0}
              minTickGap={0}
              height={30}
              tickMargin={8}
              padding={{ left: 8, right: 8 }}
              tick={{ fill: "#64748b", fontSize: 8, fontWeight: 600 }}
            />
            <YAxis width={22} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={formatTooltip}
              contentStyle={{ border: "0", borderRadius: "16px", boxShadow: "0 10px 30px rgb(15 23 42 / 0.12)" }}
            />
            <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#sessionTrendFill)" activeDot={{ r: 3, fill: "#2563eb" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-auto grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-2 text-center">
        <div><strong className="block text-xs leading-none text-slate-800">{average}</strong><small className="mt-1 block text-[7px] font-semibold uppercase tracking-wide text-slate-400">Avg / {averageUnit}</small></div>
        <div><strong className="block truncate px-1 text-xs leading-none text-blue-700">{peak.day}</strong><small className="mt-1 block text-[7px] font-semibold uppercase tracking-wide text-slate-400">Busiest · {peak.count}</small></div>
        <div><strong className="block text-xs leading-none text-emerald-700">{activePeriods}/{chartData.length}</strong><small className="mt-1 block text-[7px] font-semibold uppercase tracking-wide text-slate-400">Active periods</small></div>
      </div>
    </section>
  );
};

export default SessionTrendsChart;
