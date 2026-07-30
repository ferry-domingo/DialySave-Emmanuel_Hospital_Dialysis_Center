import { useEffect } from "react";
import { useMonitoringStore } from "../../store/monitoringStore";

const LAB_COLUMNS = [
  { key: "CBC", label: "CBC" },
  { key: "CREA", label: "CREA" },
  { key: "BUN", label: "BUN" },
  { key: "HEPA PROFILE", label: "Hepa" },
  { key: "ALKALINE", label: "Alkaline" },
  { key: "POTASSIUM", label: "Potassium" },
  { key: "PHOSPHORUS", label: "Phosphorus" },
  { key: "CALCIUM", label: "Calcium" },
  { key: "SODIUM", label: "Sodium" },
  { key: "ALBUMIN", label: "Albumin" },
  { key: "SERUM IRON/FERRITIN", label: "Ferritin" },
];

const Mark = ({ ok }) => (
  <span className="text-sm font-bold text-black">{ok ? "✓" : "✗"}</span>
);

const MonitoringPackage = ({ patientId }) => {

  const getEpoetin = (epoetin) => {
    if (epoetin === "Epokine Pre-filled") return "Pre-filled";
    if (epoetin === "Epokine Vial") return "Vial";
    return "—";
  };

  const {
    monitoring,
    loading,
    fetchMonitoring,
  } = useMonitoringStore();

  useEffect(() => {
    if (patientId) {
      fetchMonitoring(patientId);
    }
  }, [patientId]);

  const packageSessions = monitoring?.package?.sessions || [];

  const hasLab = (session, lab) =>
    session.laboratory_results?.some((x) => x.name === lab && x.done);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Package</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {monitoring?.package?.total || 0} used
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-300 text-left text-sm">

          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-700">
              <th className="px-3 py-2.5">No.</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Epoetin</th>
              <th className="px-3 py-2.5">Iron</th>
              <th className="px-3 py-2.5">Dialyzer</th>
              {LAB_COLUMNS.map((lab) => (
                <th key={lab.key} className="px-3 py-2.5 text-center">{lab.label}</th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">

            {packageSessions.length === 0 ? (

              <tr>
                <td colSpan={5 + LAB_COLUMNS.length} className="px-4 py-8 text-center text-sm text-slate-400">
                  No package monitoring found.
                </td>
              </tr>

            ) : (

              packageSessions.map((session, index) => (

                <tr key={session._id} className="transition hover:bg-slate-50">

                  <td className="px-3 py-2.5 font-semibold text-slate-500">{index + 1}</td>

                  <td className="px-3 py-2.5 font-medium text-black">
                    {new Date(session.date).toLocaleDateString()}
                  </td>

                  <td className="px-3 py-2.5 text-black">{getEpoetin(session.epoetin)}</td>

                  <td className="px-3 py-2.5 text-center"><Mark ok={!!session.iron} /></td>

                  <td className="px-3 py-2.5 text-center"><Mark ok={!!session.dialyzer} /></td>

                  {LAB_COLUMNS.map((lab) => (
                    <td key={lab.key} className="px-3 py-2.5 text-center">
                      <Mark ok={hasLab(session, lab.key)} />
                    </td>
                  ))}

                </tr>

              ))

            )}

          </tbody>

        </table>
      </div>

    </div>
  );
};

export default MonitoringPackage;