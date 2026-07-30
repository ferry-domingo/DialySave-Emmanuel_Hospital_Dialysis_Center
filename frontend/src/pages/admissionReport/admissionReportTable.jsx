import { useState } from "react";
import { useAdmissionReportStore } from "../../store/admissionReportStore";
import { Pencil } from "lucide-react";
import AdmissionReportModal from "./admissionReportModal";

const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700",
  Discharged: "bg-amber-100 text-amber-700",
};

const AdmissionReportTable = ({
  reports,
  loading,
}) => {

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const { updateInfo } = useAdmissionReportStore();

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
        Loading...
      </div>
    );
  }

  return (

    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">

      <table className="w-full min-w-[1000px] text-left text-sm">

        <thead>
          <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-700">
            <th className="px-4 py-3">Patient ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Admission</th>
            <th className="px-4 py-3">Discharge</th>
            <th className="px-4 py-3"># Dialysis</th>
            <th className="px-4 py-3">Hospital</th>
            <th className="px-4 py-3">Info Relayed By (Nurse)</th>
            <th className="px-4 py-3">Info Relayed By (Philhealth Officer)</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {reports.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-400">
                No records found.
              </td>
            </tr>
          ) : (
            reports.map((patient) => (
              <tr key={patient._id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-black">{patient.patient_id}</td>
                <td className="px-4 py-3 font-semibold text-black">{patient.full_name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {patient.admission_date
                    ? new Date(patient.admission_date).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {patient.discharge_date
                    ? new Date(patient.discharge_date).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{patient.dialysis_sessions}</td>
                <td className="px-4 py-3 text-slate-600">{patient.hospital || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {patient.info_relayed?.nurse || "—"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {patient.info_relayed?.phic_staff || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      STATUS_STYLES[patient.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {patient.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setOpenModal(true);
                      }}
                      aria-label="Edit info relayed"
                      className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>

      </table>

      <AdmissionReportModal
        open={openModal}
        patient={selectedPatient}
        onClose={() => setOpenModal(false)}
        onSave={async (data) => {
          await updateInfo(selectedPatient._id, data);
          setOpenModal(false);
        }}
      />
    </div>

  );

};

export default AdmissionReportTable;
