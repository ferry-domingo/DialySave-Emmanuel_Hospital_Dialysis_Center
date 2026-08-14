import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";

import Modal from "../../components/common/Modal";
import Topbar from "../../components/layout/Topbar";
import DoctorForm from "../../components/forms/DoctorForm";
import DoctorTable from "./DoctorTable";

import { useDoctorStore } from "../../store/doctorStore";
import Pagination from "../../components/common/Pagination";
import CredentialsModal from "../../components/common/CredentialsModal";

const PAGE_SIZE = 10;

const DoctorPage = () => {
  const {
    doctors,
    fetchDoctors,
    deleteDoctor,
  } = useDoctorStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return JSON.stringify(doctor).toLowerCase().includes(term);
  });
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedDoctors = filteredDoctors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAdd = () => {
    setSelectedDoctor(null);
    setOpenModal(true);
  };

  const handleEdit = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;

    try {
      await deleteDoctor(id);
      toast.success("Doctor deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-3">

      <Topbar title="Doctors" />

      <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-52">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search doctor..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-1 rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={14} />
          Add Doctor
        </button>

      </div>

      <DoctorTable
        doctors={paginatedDoctors}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <Pagination page={currentPage} totalItems={filteredDoctors.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="max-w-2xl"
        title={selectedDoctor ? "Edit Doctor" : "Add Doctor"}
      >
        <DoctorForm
          doctor={selectedDoctor}
          onClose={() => setOpenModal(false)}
          onCreated={(value) => setCredentials(value)}
        />
      </Modal>

      <CredentialsModal credentials={credentials} accountType="Doctor" onClose={() => setCredentials(null)} />

    </div>
  );
};

export default DoctorPage;
