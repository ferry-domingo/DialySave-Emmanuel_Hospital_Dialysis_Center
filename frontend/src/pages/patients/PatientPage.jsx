import { useEffect, useState } from "react";
import { Filter, Plus, Search, X } from "lucide-react";

import Modal from "../../components/common/Modal";
import Topbar from "../../components/layout/Topbar";

import PatientForm from "../../components/forms/PatientForm";
import PatientTable from "./PatientTable";

import { usePatientStore } from "../../store/patientStore";
import Pagination from "../../components/common/Pagination";
import CredentialsModal from "../../components/common/CredentialsModal";

const PAGE_SIZE = 10;

const PatientPage = () => {
  const {
    patients,
    loading,
    fetchPatients,
  } = usePatientStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [creationMode, setCreationMode] = useState("new");
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const term = search.trim().toLowerCase();
    const matchesTerm = !term || JSON.stringify(patient).toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    const patientDoctorId = String(patient.doctor?._id || patient.doctor || "");
    const matchesDoctor = doctorFilter === "all"
      || (doctorFilter === "unassigned" ? !patientDoctorId : patientDoctorId === doctorFilter);
    return matchesTerm && matchesStatus && matchesDoctor;
  });
  const statuses = [...new Set(patients.map((patient) => patient.status).filter(Boolean))].sort();
  const assignedDoctors = [...new Map(patients.filter((patient) => patient.doctor?._id).map((patient) => [patient.doctor._id, patient.doctor])).values()]
    .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`));
  const hasFilters = statusFilter !== "all" || doctorFilter !== "all";
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAdd = (mode) => {
    setSelectedPatient(null);
    setCreationMode(mode);
    setOpenModal(true);
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setSelectedPatient(null);
  };

  return (
    <div className="space-y-3">

      <Topbar title="Patients" />

      <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-52">
            <Search size={16} className="text-slate-400" />
            <input placeholder="Search patient..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400" />
          </div>
          <Filter size={14} className="text-slate-400" />
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter patients by status" className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[10px] text-slate-700">
            <option value="all">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={doctorFilter} onChange={(event) => { setDoctorFilter(event.target.value); setPage(1); }} aria-label="Filter patients by doctor" className="h-7 max-w-48 rounded-md border border-slate-200 bg-white px-2 text-[10px] text-slate-700">
            <option value="all">All doctors</option>
            <option value="unassigned">Unassigned</option>
            {assignedDoctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.last_name}, {doctor.first_name}</option>)}
          </select>
          {hasFilters && <button type="button" onClick={() => { setStatusFilter("all"); setDoctorFilter("all"); setPage(1); }} className="flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-semibold text-slate-500 hover:bg-slate-100"><X size={12} /> Clear</button>}
        </div>

        <div className="flex gap-1.5">
          <button onClick={() => handleAdd("old")} className="flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50">
            <Plus size={14} /> Add Old Patient
          </button>
          <button onClick={() => handleAdd("new")} className="flex items-center justify-center gap-1 rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-slate-800">
            <Plus size={14} /> Add New Patient
          </button>
        </div>

      </div>

      <PatientTable
        patients={paginatedPatients}
        loading={loading}
        onEdit={handleEdit}
      />
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <Pagination page={currentPage} totalItems={filteredPatients.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={openModal}
        onClose={handleClose}
        maxWidth="max-w-2xl"
        title={
          selectedPatient
            ? "Update Patient"
            : creationMode === "old" ? "Add Old Patient" : "Add New Patient"
        }
      >
        <PatientForm
          patient={selectedPatient}
          creationMode={creationMode}
          onClose={handleClose}
          onCreated={(value) => setCredentials(value)}
        />
      </Modal>

      <CredentialsModal credentials={credentials} accountType="Patient" onClose={() => setCredentials(null)} />

    </div>
  );
};

export default PatientPage;
