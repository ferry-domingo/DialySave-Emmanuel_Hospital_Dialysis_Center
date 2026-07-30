import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const formatTooltip = (value) => [`${value} session${value === 1 ? "" : "s"}`, "Sessions"];

const SessionTrendsChart = ({ data = [] }) => {
  const chartData = Array.isArray(data)
    ? data.map((entry) => ({
        day: entry?.day ?? "",
        count: Number(entry?.count) || 0,
      }))
    : [];
  const total = chartData.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <section className="min-w-0 rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="session-trends-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="session-trends-title" className="text-base font-bold text-slate-900">Session trends</h2>
          <p className="mt-1 text-xs text-slate-400">Sessions recorded this week</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
          <p className="text-lg font-extrabold leading-none text-emerald-700">{total}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Total</p>
        </div>
      </div>

      <div className="mt-4 h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={formatTooltip}
              contentStyle={{ border: "0", borderRadius: "16px", boxShadow: "0 10px 30px rgb(15 23 42 / 0.12)" }}
            />
            <Bar dataKey="count" fill="#16a34a" radius={[8, 8, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default SessionTrendsChart;
