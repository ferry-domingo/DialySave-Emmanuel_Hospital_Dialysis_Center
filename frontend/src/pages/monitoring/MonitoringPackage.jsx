import { useRef, useState } from "react";
import { FileSpreadsheet, Printer, Upload } from "lucide-react";
import toast from "react-hot-toast";

import Modal from "../../components/common/Modal";
import { importPackage, previewPackageImport } from "../../api/monitoringApi";
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
  { key: "SERUM IRON/FERRITIN", label: "Serum Iron / Ferritin" },
];

const LAB_PRINT_WIDTHS = [4, 4, 4, 7, 7, 7, 8, 6, 5, 5, 11];
const PACKAGE_TOTAL_ROWS = 156;
const PACKAGE_ROWS_PER_PAGE = 39;

const Mark = ({ ok }) => (
  <span className="text-sm font-bold text-black">{ok ? "✓" : "✗"}</span>
);

const MonitoringPackage = ({ patientId, patientHasDoctor, onImported }) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

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
  } = useMonitoringStore();

  const packageSessions = monitoring?.package?.sessions || [];

  const hasLab = (session, lab) => {
    const expected = lab === "SERUM IRON/FERRITIN" ? "SERUM IRON" : lab;
    return session.laboratory_request?.some((x) =>
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

  const handleFile = async (event) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (!patientHasDoctor) return toast.error("Assign a doctor to this patient before importing sessions.");
    setUploading(true);
    try {
      const { data } = await previewPackageImport(patientId, selected);
      setFile(selected);
      setPreview(data);
      setPreviewOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to preview the Excel file.");
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !preview?.canImport) return;
    setUploading(true);
    try {
      const { data } = await importPackage(patientId, file);
      toast.success(`${data.importedCount} session${data.importedCount === 1 ? "" : "s"} imported.`);
      setPreviewOpen(false);
      setPreview(null);
      setFile(null);
      onImported?.(data.year, data.monitoring);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to import historical sessions.");
    } finally {
      setUploading(false);
    }
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
            {monitoring?.package?.total || 0} total sessions
          </span>
          <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            <Upload size={14} /> {uploading ? "Reading..." : "Upload Excel"}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          <button type="button" onClick={handlePrint} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <Modal isOpen={previewOpen} title="Historical package import preview" onClose={() => !uploading && setPreviewOpen(false)} maxWidth="max-w-4xl">
        {preview && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Year", preview.year || "—"], ["Excel rows", preview.totalRows], ["New sessions", preview.validCount], ["PHIC after import", `${preview.resultingPhicTotal}/156`]].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-2"><p className="text-[9px] font-bold uppercase text-slate-400">{label}</p><b className="mt-0.5 block text-sm text-slate-900">{value}</b></div>
              ))}
            </div>
            {preview.errors.length > 0 && <section className="rounded-lg border border-red-200 bg-red-50 p-3"><h3 className="font-bold text-red-700">Fix these errors before importing</h3><ul className="mt-1 list-disc space-y-1 pl-4 text-red-600">{preview.errors.map((entry, index) => <li key={index}>{entry.rowNumber ? `Row ${entry.rowNumber}: ` : ""}{entry.errors.join(" ")}</li>)}</ul></section>}
            {preview.skippedDuplicates.length > 0 && <section className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-700"><b>{preview.skippedDuplicates.length} duplicate date(s) will be skipped:</b> {preview.skippedDuplicates.map((entry) => entry.date).join(", ")}</section>}
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-left"><thead className="sticky top-0 bg-slate-50"><tr><th className="p-2">Row</th><th className="p-2">Date</th><th className="p-2">Epoetin</th><th className="p-2">Iron</th><th className="p-2">Dialyzer</th><th className="p-2">Labs</th></tr></thead><tbody className="divide-y divide-slate-100">{preview.rows.map((row) => <tr key={row.rowNumber}><td className="p-2">{row.rowNumber}</td><td className="p-2 font-semibold">{row.date}</td><td className="p-2">{row.epoetin || "—"}</td><td className="p-2">{row.iron ? "Yes" : "—"}</td><td className="p-2">{row.dialyzer || "—"}</td><td className="p-2">{row.laboratories.join(", ") || "—"}</td></tr>)}</tbody>
              </table>
              {!preview.rows.length && <div className="grid place-items-center gap-1 p-6 text-slate-400"><FileSpreadsheet size={24} /><span>No new valid sessions to import.</span></div>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" disabled={uploading} onClick={() => setPreviewOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600">Cancel</button><button type="button" disabled={!preview.canImport || uploading} onClick={handleImport} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{uploading ? "Importing..." : `Import ${preview.validCount} sessions`}</button></div>
          </div>
        )}
      </Modal>

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
                    <th rowSpan={2}>Iron</th><th rowSpan={2}>Dialyzer</th><th colSpan={LAB_COLUMNS.length}>Laboratory Request</th>
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
