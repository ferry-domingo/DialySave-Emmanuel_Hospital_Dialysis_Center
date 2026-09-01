import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const StatCard = ({ label, unit, value, icon: Icon, iconClass, periodDays, changePercent, detailsHref, micro = false, hideTrend = false }) => {
  const isPositive = changePercent >= 0;

  if (micro) {
    const content = (
      <>
        <strong className="text-[1.125rem] font-extrabold leading-none tracking-tight text-slate-900">{value}</strong>
        <span className="mt-1 line-clamp-2 text-[9.5px] font-semibold leading-[10.5px] text-slate-500">{label}</span>
      </>
    );

    return detailsHref ? (
      <Link to={detailsHref} title={`${label}: ${value} ${unit}`} className="flex min-h-[78px] min-w-0 flex-col justify-center px-2 py-1.5 text-center transition hover:bg-slate-50">{content}</Link>
    ) : (
      <div title={`${label}: ${value} ${unit}`} className="flex min-h-[78px] min-w-0 flex-col justify-center px-2 py-1.5 text-center">{content}</div>
    );
  }

  return (
    <div className="ui-stat-card rounded-2xl bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${iconClass}`}>
          <Icon size={16} />
        </span>
        {label}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        <p className="text-xs text-slate-400">{unit}</p>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
        <span className={`inline-flex items-center gap-1 font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          Last {periodDays} days {isPositive ? "+" : ""}{changePercent}%
        </span>
        {detailsHref && (
          <Link to={detailsHref} className="font-semibold text-slate-400 transition hover:text-slate-700">
            Details &gt;
          </Link>
        )}
      </div>
    </div>
  );
};

export default StatCard;
