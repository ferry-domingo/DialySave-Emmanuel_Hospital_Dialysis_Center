import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useAdmissionReportStore } from "../../store/admissionReportStore";
import Topbar from "../../components/layout/Topbar";
import AdmissionReportTable from "./admissionReportTable";
import Pagination from "../../components/common/Pagination";

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
      .some((value) => String(value || "").toLowerCase().includes(term))
  );
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedReports = filteredReports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Topbar title="Admission Report" />
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:w-96">
          <Search size={16} className="text-slate-400" />
          <input placeholder="Search patient, hospital, or status..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full bg-transparent text-sm text-black outline-none placeholder:text-slate-400" />
        </div>
      </div>

      <AdmissionReportTable
        reports={paginatedReports}
        loading={loading}
      />
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <Pagination page={currentPage} totalItems={filteredReports.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default AdmissionReportPage;
