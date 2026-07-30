import { useEffect, useState } from "react";
import { X } from "lucide-react";

const AdmissionReportModal = ({
  patient,
  open,
  onClose,
  onSave,
}) => {

  const [form, setForm] = useState({
    nurse: "",
    phic_staff: "",
  });

  useEffect(() => {

    if (patient) {

      setForm({
        nurse: patient.info_relayed?.nurse || "",
        phic_staff:
          patient.info_relayed?.phic_staff || "",
      });

    }

  }, [patient]);

  if (!open) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Update Info Relayed
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Nurse
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-black outline-none focus:border-slate-400"
              value={form.nurse}
              onChange={(e) =>
                setForm({
                  ...form,
                  nurse: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Philhealth Officer
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-black outline-none focus:border-slate-400"
              value={form.phic_staff}
              onChange={(e) =>
                setForm({
                  ...form,
                  phic_staff: e.target.value,
                })
              }
            />
          </div>

        </div>

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save
          </button>

        </div>

      </div>

    </div>

  );

};

export default AdmissionReportModal;
