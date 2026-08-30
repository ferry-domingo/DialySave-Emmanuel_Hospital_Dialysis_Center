import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const dateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const AdmissionReportModal = ({
  patient,
  open,
  onClose,
  onSave,
}) => {

  const [form, setForm] = useState({
    nurse: "",
    phic_staff: "",
    admission_date: "",
    discharge_date: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {

    if (patient) {

      setForm({
        nurse: patient.info_relayed?.nurse || "",
        phic_staff:
          patient.info_relayed?.phic_staff || "",
        admission_date: dateInputValue(patient.admission_date),
        discharge_date: dateInputValue(patient.discharge_date),
      });

    }

  }, [patient]);

  if (!open) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">

      <div className="w-full max-w-sm rounded-xl bg-white p-3 shadow-2xl">

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Update Admission Report
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

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold uppercase tracking-wide text-blue-700">Admission Date</label>
              <input type="date" required className="h-7 w-full rounded-md border border-slate-200 px-2 text-xs text-black outline-none focus:border-blue-400" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold uppercase tracking-wide text-blue-700">Discharge Date</label>
              <input type="date" min={form.admission_date || undefined} className="h-7 w-full rounded-md border border-slate-200 px-2 text-xs text-black outline-none focus:border-blue-400" value={form.discharge_date} onChange={(e) => setForm({ ...form, discharge_date: e.target.value })} />
            </div>
          </div>

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
            disabled={saving || !form.admission_date}
            onClick={async () => {
              if (form.discharge_date && form.discharge_date < form.admission_date) return toast.error("Discharge date cannot be earlier than admission date.");
              setSaving(true);
              try { await onSave(form); toast.success("Admission report updated."); }
              catch (error) { toast.error(error.response?.data?.message || "Failed to update admission report."); }
              finally { setSaving(false); }
            }}
            className="h-7 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>

        </div>

      </div>

    </div>

  );

};

export default AdmissionReportModal;
