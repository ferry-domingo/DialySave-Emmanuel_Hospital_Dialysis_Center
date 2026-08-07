import { ClipboardCheck, Gauge, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Progress = ({ label, value, tone = "bg-blue-600" }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-[9px]"><span className="font-semibold text-slate-500">{label}</span><strong className="text-slate-800">{value}%</strong></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} /></div>
  </div>
);

const QueueItem = ({ label, value, urgent }) => (
  <div className="flex items-center justify-between gap-2 py-1.5">
    <span className="truncate text-[9px] font-medium text-slate-500">{label}</span>
    <strong className={`rounded-full px-2 py-0.5 text-[9px] ${urgent ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700"}`}>{value ?? 0}</strong>
  </div>
);

const DistributionRow = ({ label, value, color, total }) => (
  <div className="flex items-center gap-2">
    <span className="w-14 shrink-0 text-[8px] font-semibold text-slate-500">{label}</span>
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${total ? Math.max(4, (value / total) * 100) : 0}%` }} /></div>
    <strong className="w-5 text-right text-[9px] text-slate-700">{value}</strong>
  </div>
);

const PhilHealthActionPanel = ({ data = {}, operations = {} }) => {
  const distribution = data.usageDistribution || {};
  const trackedPatients = Object.values(distribution).reduce((sum, value) => sum + (Number(value) || 0), 0);

  return (
    <div className="flex h-full w-full flex-col gap-2.5">
      <section className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white px-3 py-2">
          <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white"><ShieldCheck size={14} /></span><div><h2 className="text-xs font-extrabold text-slate-900">Coverage Readiness</h2><p className="text-[8px] text-slate-400">Current-year PHIC documentation</p></div></div>
          <Link to="/monitoring" className="text-[8px] font-bold text-blue-700 hover:underline">View</Link>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
          <div className="p-2.5"><strong className="block text-lg leading-none text-slate-900">{data.sessionsThisMonth ?? 0}</strong><small className="text-[8px] text-slate-500">PHIC this month</small></div>
          <div className="p-2.5"><strong className="block text-lg leading-none text-slate-900">{data.sessionsThisYear ?? 0}</strong><small className="text-[8px] text-slate-500">PHIC this year</small></div>
          <div className="p-2.5"><strong className="block text-lg leading-none text-emerald-700">{data.readyAgreements ?? 0}</strong><small className="text-[8px] text-slate-500">Ready agreements</small></div>
          <div className="p-2.5"><strong className="block text-lg leading-none text-amber-700">{data.pendingAgreements ?? 0}</strong><small className="text-[8px] text-slate-500">Pending agreements</small></div>
        </div>
        <div className="space-y-2 p-3"><Progress label="PHIC share of sessions" value={data.coverageShare || 0} /><Progress label="Agreement readiness" value={data.agreementReadiness || 0} tone="bg-emerald-600" /><Progress label="Monthly lab completion" value={data.labCompletionRate || 0} tone="bg-violet-600" /></div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2"><Gauge size={13} className="text-blue-600" /><div><h2 className="text-xs font-extrabold text-slate-900">156-Session Utilization</h2><p className="text-[8px] text-slate-400">PHIC patients by used-session range</p></div></div>
        <div className="space-y-2">
          <DistributionRow label="Below 100" value={distribution.below100 || 0} total={trackedPatients} color="bg-emerald-500" />
          <DistributionRow label="100–129" value={distribution.from100To129 || 0} total={trackedPatients} color="bg-blue-500" />
          <DistributionRow label="130–155" value={distribution.nearLimit || 0} total={trackedPatients} color="bg-amber-500" />
          <DistributionRow label="At limit" value={distribution.atLimit || 0} total={trackedPatients} color="bg-red-500" />
        </div>
      </section>

      <section className="flex-1 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ClipboardCheck size={13} className="text-amber-600" /><h2 className="text-xs font-extrabold text-slate-900">Documentation Queue</h2></div><span className="text-[8px] font-bold text-amber-600">REVIEW</span></div>
        <div className="mt-1 divide-y divide-slate-100">
          <QueueItem label="Pending PHIC agreements" value={data.pendingAgreements} urgent={data.pendingAgreements > 0} />
          <QueueItem label="Admission info not relayed" value={data.pendingAdmissionRelay} urgent={data.pendingAdmissionRelay > 0} />
          <QueueItem label="Patients near session limit" value={data.patientsNearLimit} urgent={data.patientsNearLimit > 0} />
          <QueueItem label="Patients at session limit" value={data.patientsAtLimit} urgent={data.patientsAtLimit > 0} />
          <QueueItem label="Missing cash reasons" value={operations.missingCashReasons} urgent={operations.missingCashReasons > 0} />
        </div>
      </section>

    </div>
  );
};

export default PhilHealthActionPanel;
