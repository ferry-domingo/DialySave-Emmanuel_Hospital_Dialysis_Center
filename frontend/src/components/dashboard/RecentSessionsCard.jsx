import { Link } from "react-router-dom";

const formatSessionDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const RecentSessionsCard = ({ sessions = [], loading, showLink = true, embedded = false }) => {
  return (
    <div className={`flex h-full min-w-0 flex-col p-3 ${embedded ? "" : "rounded-xl border border-slate-200/70 bg-white shadow-sm"}`}>
      <div>
        <h2 className="text-sm font-bold text-slate-900">Recent Dialysis Sessions</h2>
      </div>

      <div className="mt-2 flex-1 overflow-x-auto">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-blue-700">
              <th className="pb-2 font-semibold">Patient ID</th>
              <th className="pb-2 font-semibold">Patient Name</th>
              <th className="pb-2 font-semibold">Assign Doctor</th>
              <th className="pb-2 text-right font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">Loading...</td>
              </tr>
            )}
            {!loading && sessions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">No sessions yet.</td>
              </tr>
            )}
            {sessions.map((session) => (
              <tr key={session._id}>
                <td className="py-1 font-semibold text-slate-700">{session.patient_id}</td>
                <td className="py-1 text-slate-600">{session.patient_name}</td>
                <td className="py-1 text-slate-600">{session.doctor_name}</td>
                <td className="whitespace-nowrap py-1 text-right text-slate-500">{formatSessionDate(session.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLink && (
        <Link to="/sessions" className="mt-3 self-start text-xs font-semibold text-slate-400 transition hover:text-slate-700">
          See More &gt;
        </Link>
      )}
    </div>
  );
};

export default RecentSessionsCard;
