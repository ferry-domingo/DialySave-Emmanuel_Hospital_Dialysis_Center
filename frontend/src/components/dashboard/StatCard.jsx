import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const StatCard = ({ label, unit, value, icon: Icon, iconClass, periodDays, changePercent, detailsHref }) => {
  const isPositive = changePercent >= 0;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${iconClass}`}>
          <Icon size={16} />
        </span>
        {label}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        <p className="text-sm text-slate-400">{unit}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
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
