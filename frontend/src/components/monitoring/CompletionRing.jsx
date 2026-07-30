const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CompletionRing = ({ percent = 0 }) => {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
        <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke="#16a34a"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-extrabold text-slate-900">{percent}%</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
          {percent === 100 ? "Complete" : "In progress"}
        </span>
      </div>
    </div>
  );
};

export default CompletionRing;
