import { useEffect, useState } from "react";
import { Printer, Search } from "lucide-react";
import { useAdmissionReportStore } from "../../store/admissionReportStore";
import Topbar from "../../components/layout/Topbar";
import AdmissionReportTable from "./admissionReportTable";
import Pagination from "../../components/common/Pagination";
import AdmissionReportPrintTable from "./AdmissionReportPrintTable";

const PAGE_SIZE = 10;

const AdmissionReportPage = () => {
  const { reports, loading, fetchReports } = useAdmissionReportStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReports();
  }, []);
  const term = search.trim().toLowerCase();
  const filteredReports = reports.filter((report) =>
    [report.patient_id, report.full_name, report.hospital, report.status, report.info_relayed?.nurse, report.info_relayed?.phic_staff]
      .some((value) => String(value || "").toLowerCase().includes(term)) ||
    JSON.stringify(report).toLowerCase().includes(term)
  );
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedReports = filteredReports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePrint = () => {
    const pageStyle = document.createElement("style");
    pageStyle.textContent = "@media print { @page { size: A4 landscape; margin: 0.3in; } }";
    document.head.appendChild(pageStyle);
    const cleanup = () => pageStyle.remove();
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  return (
    <div className="space-y-3">
      <Topbar title="Admission Report" />
      <div className="flex items-center justify-between rounded-xl bg-white p-2 shadow-sm">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-56">
          <Search size={16} className="text-slate-400" />
          <input placeholder="Search reports..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400" />
        </div>
        <button type="button" onClick={handlePrint} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
          <Printer size={14} /> Print
        </button>
      </div>

      <AdmissionReportTable
        reports={paginatedReports}
        loading={loading}
      />
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <Pagination page={currentPage} totalItems={filteredReports.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
      <AdmissionReportPrintTable reports={filteredReports} />
    </div>
  );
};

export default AdmissionReportPage;
