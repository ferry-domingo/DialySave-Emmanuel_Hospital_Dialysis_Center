import { useEffect, useState } from "react";
import { Plus, Printer, Search } from "lucide-react";

import Modal from "../../components/common/Modal";
import Topbar from "../../components/layout/Topbar";

import DialysisSessionForm from "../../components/forms/DialysisSessionForm";
import DialysisSessionTable from "./DialysisSessionTable";

import { useDialysisSessionStore } from "../../store/dialysisSessionStore";

const DialysisSessionPage = () => {
  const {
    sessions,
    loading,
    fetchSessions,
  } = useDialysisSessionStore();

  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@media print { @page { size: legal landscape; margin: 0.25in; } }";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const filteredSessions = sessions.filter((session) => {
    const patient =
      `${session.patient?.first_name} ${session.patient?.last_name}`.toLowerCase();

    return (
      patient.includes(search.toLowerCase()) ||
      session.session_id.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">

      <Topbar title="Dialysis Sessions" />

      <div className="no-print flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:w-80">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search session..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={() => {
              setSelectedSession(null);
              setOpenModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Add Session
          </button>
        </div>

      </div>

      <DialysisSessionTable
        sessions={filteredSessions}
        loading={loading}
        onEdit={(session) => {
          setSelectedSession(session);
          setOpenModal(true);
        }}
      />

      <Modal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedSession(null);
        }}
        maxWidth="max-w-3xl"
        title={
          selectedSession
            ? "Update Dialysis Session"
            : "Add Dialysis Session"
        }
      >
        <DialysisSessionForm
          session={selectedSession}
          onClose={() => {
            setOpenModal(false);
            setSelectedSession(null);
          }}
        />
      </Modal>

    </div>
  );
};

export default DialysisSessionPage;
