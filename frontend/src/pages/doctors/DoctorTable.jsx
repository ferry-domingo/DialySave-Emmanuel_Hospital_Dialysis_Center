import { Pencil, Trash2 } from "lucide-react";
import { formatDoctorName } from "../../utils/doctorName";

const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-red-100 text-red-700",
};

const DoctorTable = ({
  doctors,
  onEdit,
  onDelete,
}) => {
  if (doctors.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
        No doctors found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-xs">

        <thead>
          <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-700">
            <th className="px-2.5 py-1.5">Medical Expertise</th>
            <th className="px-2.5 py-1.5">Name</th>
            <th className="px-2.5 py-1.5">Sex</th>
            <th className="px-2.5 py-1.5">Contact Number</th>
            <th className="px-2.5 py-1.5">Status</th>
            <th className="px-2.5 py-1.5 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">

          {doctors.map((doctor) => (
            <tr key={doctor._id} className="transition hover:bg-slate-50">

              <td className="px-2.5 py-1.5 font-bold text-black">{doctor.medical_expertise || "—"}</td>

              <td className="px-2.5 py-1.5 font-semibold text-black">
                {formatDoctorName(doctor)}
              </td>

              <td className="px-2.5 py-1.5 text-slate-600">{doctor.gender}</td>

              <td className="px-2.5 py-1.5 text-slate-600">{doctor.contact_number || "—"}</td>

              <td className="px-2.5 py-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    STATUS_STYLES[doctor.status] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {doctor.status}
                </span>
              </td>

              <td className="px-2.5 py-1">
                <div className="flex justify-center gap-0.5">

                  <button
                    onClick={() => onEdit(doctor)}
                    aria-label="Edit doctor"
                    className="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil size={11} />
                  </button>

                  <button
                    onClick={() => onDelete(doctor._id)}
                    aria-label="Delete doctor"
                    className="grid h-5 w-5 place-items-center rounded text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={11} />
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

export default DoctorTable;
