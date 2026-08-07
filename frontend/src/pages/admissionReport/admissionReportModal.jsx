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

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">

      <div className="w-full max-w-sm rounded-xl bg-white p-3 shadow-2xl">

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Update Info Relayed
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-2">

          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase tracking-wide text-blue-700">
              Nurse
            </label>
            <input
              className="h-7 w-full rounded-md border border-slate-200 px-2 text-xs text-black outline-none focus:border-blue-400"
              value={form.nurse}
              onChange={(e) =>
                setForm({
                  ...form,
                  nurse: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase tracking-wide text-blue-700">
              Philhealth Officer
            </label>
            <input
              className="h-7 w-full rounded-md border border-slate-200 px-2 text-xs text-black outline-none focus:border-blue-400"
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

        <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-2">

          <button
            onClick={onClose}
            className="h-7 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="h-7 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Save
          </button>

        </div>

      </div>

    </div>

  );

};

export default AdmissionReportModal;
