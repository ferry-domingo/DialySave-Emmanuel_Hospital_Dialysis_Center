import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import Pagination from "../../components/common/Pagination";
import Topbar from "../../components/layout/Topbar";
import { useDoctorPortalStore } from "../../store/doctorPortalStore";
import PatientTable from "../patients/PatientTable";

const PAGE_SIZE = 10;

const calculateAge = (birthdate) => {
  if (!birthdate) return null;

  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayHasPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!birthdayHasPassed) age -= 1;
  return age >= 0 ? age : null;
};

const DoctorPatientsPage = () => {
  const { data, loading, error, fetchPortal } = useDoctorPortalStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPortal().catch(() => {});
    const refresh = (event) => {
      if (["patients", "dialysis-sessions"].includes(event.detail?.resource)) fetchPortal().catch(() => {});
    };
    window.addEventListener("dialysave:data-changed", refresh);
    return () => window.removeEventListener("dialysave:data-changed", refresh);
  }, [fetchPortal]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.patients || []).filter((patient) =>
      !term || JSON.stringify(patient).toLowerCase().includes(term)
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const tablePatients = filteredPatients
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    .map((patient) => ({ ...patient, doctor: data?.doctor, age: calculateAge(patient.birthdate) }));
  const sessionTotals = useMemo(() => {
    const totals = new Map();
    (data?.sessions || []).forEach((session) => {
      const patientId = session.patient?._id;
      if (patientId) totals.set(patientId, (totals.get(patientId) || 0) + 1);
    });
    return totals;
  }, [data]);

  return (
    <div className="space-y-3">
      <Topbar title="My Patients" />

      {error && !data && (
        <div className="rounded-xl bg-red-50 p-5 text-sm font-semibold text-red-600">{error}</div>
      )}

      <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-52">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search patient..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400"
          />
        </div>

        <p className="px-1 text-[10px] font-semibold text-slate-500">
          {data?.patients.length || 0} assigned patient{data?.patients.length === 1 ? "" : "s"}
        </p>
      </div>

      <PatientTable
        patients={tablePatients}
        loading={loading && !data}
        showAge
        showActions={false}
        getTotalSessions={(patient) => sessionTotals.get(patient._id) || 0}
      />

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <Pagination
          page={currentPage}
          totalItems={filteredPatients.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

    </div>
  );
};

export default DoctorPatientsPage;
