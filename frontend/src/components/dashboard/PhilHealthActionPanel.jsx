import { BarChart3, CalendarClock, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

const QueueItem = ({ label, value, urgent }) => (
  <div className="flex items-center justify-between gap-2 py-1">
    <span className="truncate text-[8px] font-medium text-slate-500">{label}</span>
    <strong className={`rounded-full px-1.5 py-0.5 text-[8px] ${urgent ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700"}`}>{value ?? 0}</strong>
  </div>
);

const DistributionRow = ({ label, value, color, total }) => (
  <div className="flex items-center gap-2">
    <span className="w-14 shrink-0 text-[8px] font-semibold text-slate-500">{label}</span>
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${total ? Math.max(4, (value / total) * 100) : 0}%` }} /></div>
    <strong className="w-5 text-right text-[9px] text-slate-700">{value}</strong>
  </div>
);

const appointmentDate = (value) => new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
}).format(new Date(value));

const PhilHealthActionPanel = ({ data = {}, operations = {}, appointments = [] }) => {
  const distribution = data.usageDistribution || {};
  const trackedPatients = Object.values(distribution).reduce((sum, value) => sum + (Number(value) || 0), 0);

  return (
    <div className="grid h-full w-full min-h-0 grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2">
      <section className="upcoming-appointments-card flex h-[302px] min-h-[302px] flex-col overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-emerald-50 bg-gradient-to-r from-emerald-50 to-white px-3 py-1.5">
          <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white"><CalendarClock size={14} /></span><div><h2 className="text-sm font-extrabold text-slate-900">Upcoming Appointments</h2><p className="text-[9px] text-slate-500">Next dialysis sessions from alerts</p></div></div>
          <Link to="/alerts" className="text-[9px] font-bold text-emerald-700 hover:underline">View all</Link>
        </div>
        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {appointments.map((appointment) => (
            <Link key={appointment._id} to="/alerts" className="flex min-w-0 items-center gap-2 py-2 transition hover:bg-emerald-50/60">
              <span className="min-w-0 flex-1"><strong className="block truncate text-[11px] font-extrabold text-slate-900">{appointment.patientName}</strong><small className="mt-0.5 block truncate text-[9px] font-medium text-slate-500">{appointment.patientId}</small></span>
              <time className="shrink-0 text-right text-[9px] font-extrabold text-emerald-700" dateTime={appointment.scheduledFor}>{appointmentDate(appointment.scheduledFor)}</time>
            </Link>
          ))}
          {!appointments.length && <div className="grid h-full min-h-16 place-items-center text-center text-[9px] text-slate-400">No upcoming dialysis appointments</div>}
        </div>
      </section>

      <section className="order-3 flex min-h-0 flex-col rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
        <div className="mb-1 flex items-center gap-2"><BarChart3 size={13} className="text-blue-600" /><div><h2 className="text-[11px] font-extrabold text-slate-900">156-Session Utilization</h2><p className="text-[7px] text-slate-400">PHIC patients by used-session range</p></div></div>
        <div className="flex min-h-0 flex-1 flex-col justify-evenly">
          <DistributionRow label="Below 100" value={distribution.below100 || 0} total={trackedPatients} color="bg-emerald-500" />
          <DistributionRow label="100–129" value={distribution.from100To129 || 0} total={trackedPatients} color="bg-blue-500" />
          <DistributionRow label="130–155" value={distribution.nearLimit || 0} total={trackedPatients} color="bg-amber-500" />
          <DistributionRow label="At limit" value={distribution.atLimit || 0} total={trackedPatients} color="bg-red-500" />
        </div>
      </section>

      <section className="order-2 flex min-h-0 flex-col rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ClipboardCheck size={13} className="text-amber-600" /><h2 className="text-xs font-extrabold text-slate-900">Documentation Queue</h2></div><span className="text-[8px] font-bold text-amber-600">REVIEW</span></div>
        <div className="mt-1 flex min-h-0 flex-1 flex-col justify-evenly divide-y divide-slate-100">
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
