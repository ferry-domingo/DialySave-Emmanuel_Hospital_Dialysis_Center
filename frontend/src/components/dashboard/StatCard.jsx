import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const StatCard = ({ label, unit, value, icon: Icon, iconClass, periodDays, changePercent, detailsHref, micro = false, hideTrend = false }) => {
  const isPositive = changePercent >= 0;

  if (micro) {
    const content = (
      <>
        <span className="flex items-center gap-2">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${iconClass}`}><Icon size={14} /></span>
          <strong className="text-base leading-none text-slate-900">{value}</strong>
        </span>
        <span className="mt-1.5 line-clamp-2 h-5 text-[9px] font-semibold leading-[10px] text-slate-500">{label}</span>
        <span className={`mt-1 flex h-2.5 items-center gap-0.5 text-[8px] font-bold leading-none ${hideTrend ? "invisible" : isPositive ? "text-emerald-600" : "text-red-500"}`} aria-hidden={hideTrend || undefined}>
          {isPositive ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
          {periodDays ?? 0}d {isPositive ? "+" : ""}{changePercent ?? 0}%
        </span>
      </>
    );

    return detailsHref ? (
      <Link to={detailsHref} title={`${label}: ${value} ${unit}`} className="flex min-h-[78px] min-w-0 flex-col justify-center px-2 py-1.5 transition hover:bg-slate-50">{content}</Link>
    ) : (
      <div title={`${label}: ${value} ${unit}`} className="flex min-h-[78px] min-w-0 flex-col justify-center px-2 py-1.5">{content}</div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
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
