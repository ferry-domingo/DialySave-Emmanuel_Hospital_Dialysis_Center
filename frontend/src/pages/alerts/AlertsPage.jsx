import { useEffect, useMemo, useState } from "react";
import { BellRing, CalendarClock, CheckCheck, Pencil, Search, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Pagination from "../../components/common/Pagination";
import { useAuthStore } from "../../store/authStore";
import { usePatientStore } from "../../store/patientStore";
import { useNotificationStore } from "../../store/notificationStore";
import { normalizeRole, ROLES } from "../../utils/roles";

const PAGE_SIZE = 10;

const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const matchesSearch = (query, values) => {
  const searchableText = normalizeSearchText(values.filter(Boolean).join(" "));
  return normalizeSearchText(query)
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((token) => searchableText.includes(token));
};

const getPatientName = (patient) =>
  [patient?.first_name, patient?.middle_name, patient?.last_name]
    .filter(Boolean)
    .join(" ");

const AlertsPage = () => {
  const user = useAuthStore((state) => state.user);
  const isManager = [ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER].includes(normalizeRole(user?.role));
  const { patients, fetchPatients } = usePatientStore();
  const { notifications, unreadCount, loading, fetchNotifications, sendNotification, updateNotification, deleteNotification, markRead, markAllRead } = useNotificationStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", type: "Dialysis Schedule", title: "Next dialysis session", message: "", scheduledFor: "" });

  useEffect(() => {
    fetchNotifications();
    if (isManager) fetchPatients();
  }, [fetchNotifications, fetchPatients, isManager]);

  const submitAlert = async (event) => {
    event.preventDefault();
    if (!form.patientId) return toast.error("Select a patient or All Patients.");
    setSending(true);
    try {
      const result = editingId
        ? await updateNotification(editingId, form)
        : await sendNotification(form);
      toast.success(result.message);
      setEditingId("");
      setPatientSearch("");
      setForm({ patientId: "", type: "Dialysis Schedule", title: "Next dialysis session", message: "", scheduledFor: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send alert.");
    } finally {
      setSending(false);
    }
  };

  const editAlert = (item) => {
    setEditingId(item._id);
    setPatientSearch(
      `${item.patient?.patient_id || ""} — ${getPatientName(item.patient)}`.trim()
    );
    setForm({
      patientId: item.patient?._id || "",
      type: item.type,
      title: item.title,
      message: item.message || "",
      scheduledFor: item.scheduledFor ? item.scheduledFor.slice(0, 10) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeAlert = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? This will also remove it from the patient account.`)) return;
    try {
      const result = await deleteNotification(item._id);
      toast.success(result.message);
      if (editingId === item._id) {
        setEditingId("");
        setPatientSearch("");
        setForm({ patientId: "", type: "Dialysis Schedule", title: "Next dialysis session", message: "", scheduledFor: "" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete alert.");
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter((item) =>
      matchesSearch(search, [
        item.title,
        item.message,
        item.type,
        item.patient?.patient_id,
        item.patient?.first_name,
        item.patient?.middle_name,
        item.patient?.last_name,
      ])
    );
  }, [notifications, search]);
  const patientMatches = useMemo(() => {
    return patients
      .filter((patient) =>
        matchesSearch(patientSearch, [
          patient.patient_id,
          patient.first_name,
          patient.middle_name,
          patient.last_name,
        ])
      )
      .slice(0, 8);
  }, [patients, patientSearch]);

  const selectPatient = (patient) => {
    setForm((value) => ({ ...value, patientId: patient._id }));
    setPatientSearch(`${patient.patient_id} — ${getPatientName(patient)}`);
    setPatientPickerOpen(false);
  };

  const selectAllPatients = () => {
    setForm((value) => ({ ...value, patientId: "all" }));
    setPatientSearch("All Patients");
    setPatientPickerOpen(false);
  };
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Topbar title={isManager ? "Patient Alerts" : "My Alerts"} />

      {isManager && (
        <form onSubmit={submitAlert} className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600"><Send size={20} /></span>
            <div><h2 className="font-bold text-slate-900">{editingId ? "Edit patient alert" : "Notify a patient"}</h2><p className="text-sm text-slate-500">{editingId ? "Update the alert shown in the patient account." : "Send a dialysis schedule or another important alert."}</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="relative space-y-1 text-sm font-semibold text-slate-700">Patient
              <div className="relative mt-1">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={patientSearch}
                  onFocus={() => setPatientPickerOpen(true)}
                  onBlur={() => window.setTimeout(() => setPatientPickerOpen(false), 150)}
                  onChange={(event) => {
                    setPatientSearch(event.target.value);
                    setForm((value) => ({ ...value, patientId: "" }));
                    setPatientPickerOpen(true);
                  }}
                  placeholder="Search Patient ID or name..."
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-normal outline-none focus:border-slate-400"
                />
                {patientPickerOpen && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {!editingId && (
                      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={selectAllPatients} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-100">
                        All Patients
                      </button>
                    )}
                    {patientMatches.map((patient) => (
                      <button key={patient._id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectPatient(patient)} className="w-full rounded-xl px-3 py-2.5 text-left hover:bg-slate-100">
                        <span className="block text-sm font-bold text-slate-900">{getPatientName(patient)}</span>
                        <span className="block text-xs font-semibold text-slate-400">{patient.patient_id}</span>
                      </button>
                    ))}
                    {patientMatches.length === 0 && <p className="px-3 py-3 text-sm font-normal text-slate-400">No matching patient found.</p>}
                  </div>
                )}
              </div>
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-700">Alert type
              <select value={form.type} onChange={(event) => {
                const type = event.target.value;
                setForm((value) => ({ ...value, type, title: type === "Dialysis Schedule" ? "Next dialysis session" : "" }));
              }} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none">
                <option>Dialysis Schedule</option><option>General Alert</option>
              </select>
            </label>
            <Input label="Title" required maxLength={120} value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} />
            {form.type === "Dialysis Schedule" && <Input label="Session date" type="date" required value={form.scheduledFor} onChange={(event) => setForm((value) => ({ ...value, scheduledFor: event.target.value }))} />}
            <label className="space-y-1 text-sm font-semibold text-slate-700 md:col-span-2">Message <span className="font-normal text-slate-400">(optional)</span>
              <textarea maxLength={1000} rows={4} value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} className="mt-1 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" placeholder="Add instructions or other details if needed..." />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={sending}>{sending ? "Saving..." : editingId ? "Save changes" : "Send alert"}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={() => { setEditingId(""); setPatientSearch(""); setForm({ patientId: "", type: "Dialysis Schedule", title: "Next dialysis session", message: "", scheduledFor: "" }); }}><span className="inline-flex items-center gap-2"><X size={16} /> Cancel edit</span></Button>}
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:w-96">
          <Search size={16} className="text-slate-400" /><input placeholder="Search alerts..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full bg-transparent text-sm outline-none" />
        </div>
        {!isManager && unreadCount > 0 && <Button variant="secondary" onClick={markAllRead}><span className="inline-flex items-center gap-2"><CheckCheck size={16} /> Mark all read</span></Button>}
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {loading && <p className="p-10 text-center text-sm text-slate-400">Loading alerts...</p>}
        {!loading && visible.length === 0 && <p className="p-10 text-center text-sm text-slate-400">No alerts found.</p>}
        <div className="divide-y divide-slate-100">
          {visible.map((item) => (
            <div key={item._id} onClick={() => !isManager && !item.isRead && markRead(item._id)} className={`flex w-full gap-4 p-5 text-left transition hover:bg-slate-50 ${!isManager && !item.isRead ? "cursor-pointer bg-blue-50/60" : ""}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.type === "Dialysis Schedule" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{item.type === "Dialysis Schedule" ? <CalendarClock size={20} /> : <BellRing size={20} />}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{item.title}</h3>{!isManager && !item.isRead && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>}</div>
                {isManager && <p className="text-xs font-semibold text-slate-500">{item.patient?.patient_id} — {getPatientName(item.patient)}</p>}
                {item.scheduledFor && <p className="mt-3 text-xl font-extrabold text-emerald-700">{new Date(item.scheduledFor).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</p>}
                {item.message && <p className="mt-2 text-sm text-slate-600">{item.message}</p>}
                <p className="mt-2 text-xs text-slate-400">Sent {new Date(item.createdAt).toLocaleString()}</p>
              </div>
              {isManager && <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => editAlert(item)} aria-label="Edit alert" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"><Pencil size={16} /></button>
                <button type="button" onClick={() => removeAlert(item)} aria-label="Delete alert" className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={16} /></button>
              </div>}
            </div>
          ))}
        </div>
        <Pagination page={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default AlertsPage;
