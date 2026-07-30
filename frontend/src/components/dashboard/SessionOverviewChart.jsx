import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PAYMENT_TYPES = [
  { name: "PHIC", color: "#16a34a" },
  { name: "PCSO", color: "#f43f5e" },
  { name: "CASH", color: "#eab308" },
  { name: "MISC / V.A.S", color: "#6366f1" },
];

const SessionOverviewChart = ({ today = 0, byPaymentType }) => {
  const paymentCounts = byPaymentType ?? {};
  const data = PAYMENT_TYPES.map(({ name, color }) => ({
    name,
    color,
    value: Number(paymentCounts[name]) || 0,
  }));
  const hasData = data.some((entry) => entry.value > 0);
  const total = Number(today) || 0;

  return (
    <section className="min-w-0 rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="session-overview-title">
      <div>
        <h2 id="session-overview-title" className="text-base font-bold text-slate-900">Session overview</h2>
        <p className="mt-1 text-xs text-slate-400">Today&apos;s sessions by payment type</p>
      </div>

      <div className="mt-4 flex flex-col-reverse items-center gap-4 sm:flex-row">
        <div className="w-full flex-1 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Sessions today</span>
            <span className="font-bold text-slate-900">{total}</span>
          </div>
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>

        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={hasData ? data : [{ name: "Empty", value: 1 }]}
                dataKey="value"
                innerRadius={42}
                outerRadius={64}
                stroke="none"
              >
                {hasData
                  ? data.map((entry) => <Cell key={entry.name} fill={entry.color} />)
                  : <Cell fill="#e2e8f0" />}
              </Pie>
              {hasData && <Tooltip />}
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-xl font-extrabold text-slate-900">{total}</p>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Total</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SessionOverviewChart;
