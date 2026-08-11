import { useEffect } from "react";
import { useMonitoringStore } from "../../store/monitoringStore";
import { Printer } from "lucide-react";

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
  { key: "SERUM IRON/FERRITIN", label: "Serum Iron / Ferritin" },
];

const LAB_PRINT_WIDTHS = [4, 4, 4, 7, 7, 7, 8, 6, 5, 5, 11];
const PACKAGE_TOTAL_ROWS = 156;
const PACKAGE_ROWS_PER_PAGE = 39;

const Mark = ({ ok }) => (
  <span className="text-sm font-bold text-black">{ok ? "✓" : "✗"}</span>
);

const MonitoringPackage = ({ patientId }) => {

  const getEpoetin = (epoetin) => {
    const injection = String(epoetin || "").trim().toLowerCase();
    if (!injection) return "—";
    if (injection.includes("eposino")) return "Eposino";
    if (injection.includes("flu") && injection.includes("vaccine")) return "Flu-vaccine";
    if (injection.includes("pre-filled") || injection.includes("prefilled")) return "Pre-filled";
    if (injection.includes("vial")) return "Vial";
    return epoetin;
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

  const hasLab = (session, lab) => {
    const expected = lab === "SERUM IRON/FERRITIN" ? "SERUM IRON" : lab;
    return session.laboratory_results?.some((x) =>
      String(x.name || "").trim().toUpperCase() === expected && x.done
    );
  };

  const handlePrint = () => {
    const pageStyle = document.createElement("style");
    pageStyle.textContent = "@media print { @page { size: A4 landscape; margin: 0.3in; } }";
    document.head.appendChild(pageStyle);
    const cleanup = () => pageStyle.remove();
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  const printPageCount = Math.ceil(PACKAGE_TOTAL_ROWS / PACKAGE_ROWS_PER_PAGE);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-5 text-center text-sm text-slate-400 shadow-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-2.5 shadow-sm">

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Package</h2>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
            {monitoring?.package?.total || 0} used
          </span>
          <button type="button" onClick={handlePrint} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-300 text-left text-xs [&_td]:!px-2 [&_td]:!py-1.5 [&_th]:!px-2 [&_th]:!py-1.5">

          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-700">
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

      <div className="print-page package-monitoring-print">
        {Array.from({ length: printPageCount }, (_, pageIndex) => {
          const pageStart = pageIndex * PACKAGE_ROWS_PER_PAGE;
          const pageRowCount = Math.min(PACKAGE_ROWS_PER_PAGE, PACKAGE_TOTAL_ROWS - pageStart);
          const pageSessions = packageSessions.slice(pageStart, pageStart + pageRowCount);
          return (
            <section key={pageIndex} className="package-monitoring-print-page">
              <table>
                <colgroup>
                  <col style={{ width: "3%" }} /><col style={{ width: "12%" }} /><col style={{ width: "7%" }} />
                  <col style={{ width: "4.5%" }} /><col style={{ width: "5.5%" }} />
                  {LAB_PRINT_WIDTHS.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th rowSpan={2}>No.</th><th rowSpan={2}>Date of Session</th><th rowSpan={2}>Epoetin</th>
                    <th rowSpan={2}>Iron</th><th rowSpan={2}>Dialyzer</th><th colSpan={LAB_COLUMNS.length}>Laboratory</th>
                  </tr>
                  <tr>{LAB_COLUMNS.map((lab) => <th key={lab.key}>{lab.label}</th>)}</tr>
                </thead>
                <tbody>
                  {Array.from({ length: pageRowCount }, (_, rowIndex) => {
                    const session = pageSessions[rowIndex];
                    return (
                      <tr key={rowIndex}>
                        <td>{pageStart + rowIndex + 1}</td>
                        <td>{session ? new Date(session.date).toLocaleDateString("en-PH") : ""}</td>
                        <td>{session ? getEpoetin(session.epoetin) : ""}</td>
                        <td>{session?.iron ? "✓" : ""}</td>
                        <td>{session?.dialyzer ? "✓" : ""}</td>
                        {LAB_COLUMNS.map((lab) => <td key={lab.key}>{session && hasLab(session, lab.key) ? "✓" : ""}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>

    </div>
  );
};

export default MonitoringPackage;
