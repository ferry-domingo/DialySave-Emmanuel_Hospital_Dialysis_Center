import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import Modal from "../../components/common/Modal";
import Topbar from "../../components/layout/Topbar";

import PatientForm from "../../components/forms/PatientForm";
import PatientTable from "./PatientTable";

import { usePatientStore } from "../../store/patientStore";
import Pagination from "../../components/common/Pagination";

const PAGE_SIZE = 10;

const PatientPage = () => {
  const {
    patients,
    loading,
    fetchPatients,
  } = usePatientStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const fullname =
      `${patient.first_name} ${patient.last_name}`.toLowerCase();

    return (
      fullname.includes(search.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(search.toLowerCase())
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAdd = () => {
    setSelectedPatient(null);
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
    <div className="space-y-6">

      <Topbar title="Patients" />

      <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:w-80">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search patient..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={16} />
          Add Patient
        </button>

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
            : "Add Patient"
        }
      >
        <PatientForm
          patient={selectedPatient}
          onClose={handleClose}
        />
      </Modal>

    </div>
  );
};

export default PatientPage;
