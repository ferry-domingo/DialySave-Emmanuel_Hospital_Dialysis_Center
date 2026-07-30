import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { usePatientStore } from "../../store/patientStore";

const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-red-100 text-red-700",
  Discharged: "bg-amber-100 text-amber-700",
};

const PatientTable = ({
  patients,
  loading,
  onEdit,
}) => {
  const { deletePatient } = usePatientStore();

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient?"
    );

    if (!confirmDelete) return;

    try {
      await deletePatient(id);
      toast.success("Patient deleted successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete patient."
      );
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
        Loading patients...
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
        No patients found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-700">
            <th className="px-4 py-3">Patient ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Doctor</th>
            <th className="px-4 py-3">Gender</th>
            <th className="px-4 py-3">Blood Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {patients.map((patient) => (
            <tr key={patient._id} className="transition hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-black">
                {patient.patient_id}
              </td>

              <td className="px-4 py-3 font-semibold text-black">
                {patient.first_name} {patient.last_name}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {patient.doctor
                  ? `${patient.doctor.first_name} ${patient.doctor.last_name}`
                  : "—"}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {patient.gender}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {patient.blood_type}
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
                <div className="flex justify-center gap-1.5">

                  <button
                    onClick={() => onEdit(patient)}
                    aria-label="Edit patient"
                    className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(patient._id)}
                    aria-label="Delete patient"
                    className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientTable;