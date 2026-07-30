import { Link } from "react-router-dom";

const RecentSessionsCard = ({ sessions = [], loading, showLink = true }) => {
  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Recent Dialysis Sessions</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Today</span>
      </div>

      <div className="mt-4 flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 font-semibold">Patient ID</th>
              <th className="pb-2 font-semibold">Patient Name</th>
              <th className="pb-2 font-semibold">Assign Doctor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">Loading...</td>
              </tr>
            )}
            {!loading && sessions.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">No sessions yet.</td>
              </tr>
            )}
            {sessions.map((session) => (
              <tr key={session._id}>
                <td className="py-2.5 font-semibold text-slate-700">{session.patient_id}</td>
                <td className="py-2.5 text-slate-600">{session.patient_name}</td>
                <td className="py-2.5 text-slate-600">{session.doctor_name}</td>
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
