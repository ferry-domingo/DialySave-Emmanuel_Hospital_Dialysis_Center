import { Eye, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { usePatientStore } from "../../store/patientStore";
import { formatDoctorName } from "../../utils/doctorName";

const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-red-100 text-red-700",
  Discharged: "bg-amber-100 text-amber-700",
};

const PatientTable = ({
  patients,
  loading,
  onEdit,
  onView,
  showAge = false,
  showActions = true,
  getTotalSessions,
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
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-700">
            <th className="px-2.5 py-1.5">Patient ID</th>
            <th className="px-2.5 py-1.5">Name</th>
            <th className="px-2.5 py-1.5">Doctor</th>
            <th className="px-2.5 py-1.5">Sex</th>
            {showAge && <th className="px-2.5 py-1.5">Age</th>}
            <th className="px-2.5 py-1.5">Blood Type</th>
            <th className="px-2.5 py-1.5">Contact Number</th>
            <th className="px-2.5 py-1.5">Status</th>
            {getTotalSessions && <th className="px-2.5 py-1.5 text-center">Total Dialysis Sessions</th>}
            {showActions && <th className="px-2.5 py-1.5 text-center">Actions</th>}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {patients.map((patient) => (
            <tr key={patient._id} className="transition hover:bg-slate-50">
              <td className="px-2.5 py-1.5 font-bold text-black">
                {patient.patient_id}
              </td>

              <td className="px-2.5 py-1.5 font-semibold text-black">
                {patient.first_name} {patient.last_name}
              </td>

              <td className="px-2.5 py-1.5 text-slate-600">
                {patient.doctor
                  ? formatDoctorName(patient.doctor)
                  : "—"}
              </td>

              <td className="px-2.5 py-1.5 text-slate-600">
                {patient.gender}
              </td>

              {showAge && (
                <td className="px-2.5 py-1.5 text-slate-600">
                  {patient.age ?? "—"}
                </td>
              )}

              <td className="px-2.5 py-1.5 text-slate-600">
                {patient.blood_type}
              </td>

              <td className="px-2.5 py-1.5 text-slate-600">{patient.contact_number || "—"}</td>

              <td className="px-2.5 py-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    STATUS_STYLES[patient.status] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {patient.status}
                </span>
              </td>

              {getTotalSessions && (
                <td className="px-2.5 py-1.5 text-center font-semibold text-slate-600">
                  {getTotalSessions(patient)}
                </td>
              )}

              {showActions && (
                <td className="px-2.5 py-1">
                  <div className="flex justify-center gap-0.5">

                  {onView && (
                    <button
                      onClick={() => onView(patient)}
                      aria-label={`View ${patient.first_name} ${patient.last_name}`}
                      className="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye size={11} />
                    </button>
                  )}

                  {onEdit && (
                    <>
                      <button
                        onClick={() => onEdit(patient)}
                        aria-label="Edit patient"
                        className="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={11} />
                      </button>

                      <button
                        onClick={() => handleDelete(patient._id)}
                        aria-label="Delete patient"
                        className="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}

                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientTable;
