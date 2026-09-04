import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";

import api from "../../api/axios";
import Topbar from "../../components/layout/Topbar";
import { useAuthStore } from "../../store/authStore";
import { classifyPhicSessionDates, PHIC_GROUPS } from "../../utils/phicSessionGroups";

const formatLongDate = (value) => new Date(value).toLocaleDateString(undefined, {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const savePdfFile = (doc, filename) => {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
};

const PatientPhicMonitoringPage = () => {
  const user = useAuthStore((state) => state.user);
  const [monitoring, setMonitoring] = useState(null);
  const [activeTab, setActiveTab] = useState("phic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("patient-monitoring-view");
    const identifier = user?.patient?._id || (typeof user?.patient === "string" ? user.patient : "") || user?.loginId || user?.id;
    if (!identifier) return () => document.body.classList.remove("patient-monitoring-view");
    api.get(`/patient-portal/${identifier}`)
      .then(({ data }) => setMonitoring(data.data?.monitoring || null))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load treatment monitoring."))
      .finally(() => setLoading(false));
    return () => document.body.classList.remove("patient-monitoring-view");
  }, [user]);

  const phicDates = monitoring?.phic?.dates || [];
  const dialyzerSessions = monitoring?.dialyzer?.sessions || [];
  const classifiedDates = classifyPhicSessionDates(phicDates);
  const dateCellClass = (group) => {
    if (group === PHIC_GROUPS.FIRST_HALF) return "border-amber-100 bg-amber-50";
    if (group === PHIC_GROUPS.SECOND_HALF) return "border-emerald-100 bg-emerald-50";
    if (group === PHIC_GROUPS.EXCESS) return "border-red-100 bg-red-50";
    return "border-slate-100 bg-slate-50";
  };
  const dialyzerDateCellClass = (index) => Math.floor(index / 5) % 2 === 0
    ? "border-cyan-100 bg-cyan-50"
    : "border-amber-100 bg-amber-50";

  const downloadPdf = () => {
    if (!window.confirm("Do you want to download this as PDF?")) return;

    if (activeTab === "phic") {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const margin = 10;
      const tableTop = 31;
      const tableWidth = 277;
      const pairWidth = tableWidth / 10;
      const numberWidth = 6;
      const rowHeight = 10;

      doc.setDrawColor(0);
      doc.setLineWidth(0.25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("PHILHEALTH", 148.5, 17, { align: "center" });
      doc.setFontSize(14);
      doc.text("SESSION DATES", margin + 1, 27);

      for (let row = 0; row < 16; row += 1) {
        for (let column = 0; column < 10; column += 1) {
          const index = column * 16 + row;
          const x = margin + column * pairWidth;
          const y = tableTop + row * rowHeight;
          const item = classifiedDates[index];
          const fill = item?.group === PHIC_GROUPS.FIRST_HALF
            ? [254, 249, 195]
            : item?.group === PHIC_GROUPS.SECOND_HALF
              ? [220, 252, 231]
              : item?.group === PHIC_GROUPS.EXCESS
                ? [254, 226, 226]
                : [255, 255, 255];

          doc.setFillColor(...fill);
          doc.rect(x, y, numberWidth, rowHeight);
          doc.rect(x + numberWidth, y, pairWidth - numberWidth, rowHeight, "FD");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(String(index + 1), x + numberWidth / 2, y + 6.2, { align: "center" });
          if (item?.value) {
            doc.setFontSize(6.4);
            doc.text(new Date(item.value).toLocaleDateString("en-PH"), x + numberWidth + (pairWidth - numberWidth) / 2, y + 6.2, { align: "center" });
          }
        }
      }
      savePdfFile(doc, "PHIC-Session-Monitoring.pdf");
      return;
    }

    const sessionsPerPage = 150;
    const pageCount = Math.max(1, Math.ceil(dialyzerSessions.length / sessionsPerPage));
    const reportYear = dialyzerSessions[0]?.date ? new Date(dialyzerSessions[0].date).getFullYear() : new Date().getFullYear();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 10;
    const tableTop = 24;
    const numberWidth = 11;
    const dateWidth = (190 - numberWidth) / 5;
    const rowHeight = 8;

    for (let page = 0; page < pageCount; page += 1) {
      if (page > 0) doc.addPage();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(18);
      doc.text(`DIALYZER MONITORING ${reportYear}`, 105, 15, { align: "center" });
      doc.setDrawColor(0);
      doc.setLineWidth(0.25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.rect(margin, tableTop, numberWidth, rowHeight);
      doc.text("No.:", margin + numberWidth / 2, tableTop + 5.2, { align: "center" });
      for (let column = 0; column < 5; column += 1) {
        const x = margin + numberWidth + column * dateWidth;
        doc.rect(x, tableTop, dateWidth, rowHeight);
        doc.text(String(column + 1), x + dateWidth / 2, tableTop + 5.2, { align: "center" });
      }
      doc.setFont("helvetica", "normal");
      for (let row = 0; row < 30; row += 1) {
        const y = tableTop + rowHeight + row * rowHeight;
        const globalRow = page * 30 + row;
        doc.rect(margin, y, numberWidth, rowHeight);
        doc.text(String(globalRow + 1), margin + numberWidth / 2, y + 5.2, { align: "center" });
        for (let column = 0; column < 5; column += 1) {
          const x = margin + numberWidth + column * dateWidth;
          const item = dialyzerSessions[page * sessionsPerPage + row * 5 + column];
          doc.rect(x, y, dateWidth, rowHeight);
          if (item?.date) doc.text(new Date(item.date).toLocaleDateString("en-PH"), x + dateWidth / 2, y + 5.2, { align: "center" });
        }
      }
    }
    savePdfFile(doc, "Dialyzer-Monitoring.pdf");
  };

  return (
    <div className="min-w-0 space-y-3">
      <Topbar title="Treatment Monitoring" />
      <Link to="/patient-portal" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"><ArrowLeft size={14} />Back to Dashboard</Link>
      {loading && <div className="grid min-h-40 place-items-center rounded-xl bg-white text-sm text-slate-400 shadow-sm">Loading treatment monitoring...</div>}
      {error && <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">{error}</div>}
      {!loading && !error && <section className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">{activeTab === "phic" ? <ShieldCheck size={19} /> : <Activity size={19} />}</span><div><h1 className="text-base font-black text-slate-950">{activeTab === "phic" ? "PHIC Session Dates" : "Dialyzer Treatment Dates"}</h1><p className="text-xs text-slate-500">{activeTab === "phic" ? "Your PhilHealth dialysis sessions" : "Your dialyzer treatment sessions"}</p></div></div><div className="flex w-full items-center gap-1 sm:w-auto"><div className="flex min-w-0 flex-1 gap-1 rounded-lg bg-slate-100 p-1"><button type="button" onClick={() => setActiveTab("phic")} className={`flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-bold sm:flex-none ${activeTab === "phic" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}><ShieldCheck size={14} />PHIC</button><button type="button" onClick={() => setActiveTab("dialyzer")} className={`flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-bold sm:flex-none ${activeTab === "dialyzer" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}><Activity size={14} />Dialyzer</button></div><button type="button" onClick={downloadPdf} title={`Download ${activeTab === "phic" ? "PHIC" : "dialyzer"} PDF`} aria-label={`Download ${activeTab === "phic" ? "PHIC" : "dialyzer"} monitoring as PDF`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"><Download size={16} /></button></div></div>
        {activeTab === "phic" ? <><div className="border-b border-slate-100 px-4 py-3"><p className="text-2xl font-black text-slate-950">{phicDates.length}<span className="text-sm font-bold text-slate-400"> / 156</span></p><p className="text-[10px] font-semibold text-emerald-700">{Math.max(0, 156 - phicDates.length)} remaining</p></div><div className="grid grid-cols-2 gap-1.5 p-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{Array.from({ length: 156 }, (_, index) => { const item = classifiedDates[index]; return <div key={index} className={`flex min-w-0 items-center justify-between gap-1 rounded border px-2 py-1.5 ${dateCellClass(item?.group)}`}><span className="text-[10px] font-bold text-slate-500">{index + 1}</span><span className="min-w-0 truncate whitespace-nowrap text-[10px] font-semibold text-slate-800">{item?.value ? formatLongDate(item.value) : "-"}</span></div>; })}</div></> : <div className="border-t border-slate-100 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-extrabold text-slate-900">Dialyzer Treatment Session Dates</p><span className="text-[9px] font-medium text-slate-400">{dialyzerSessions.length} recorded</span></div><div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">{dialyzerSessions.map((item, index) => <div key={`${item.id || item.date}-${index}`} className={`flex min-w-0 items-center justify-between gap-1 rounded border px-2 py-1.5 ${dialyzerDateCellClass(index)}`}><span className="text-[10px] font-bold text-slate-500">{index + 1}</span><span className="whitespace-nowrap text-[10px] font-semibold text-slate-800">{formatLongDate(item.date)}</span></div>)}{!dialyzerSessions.length && <p className="col-span-full py-8 text-center text-xs text-slate-400">No dialyzer sessions recorded.</p>}</div></div>}
      </section>}
    </div>
  );
};

export default PatientPhicMonitoringPage;
