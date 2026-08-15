import { useEffect, useMemo, useState } from "react";
import { Archive, BellRing, CalendarClock, CheckCheck, List, Pencil, Search, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { useAuthStore } from "../../store/authStore";
import { usePatientStore } from "../../store/patientStore";
import { useNotificationStore } from "../../store/notificationStore";
import { normalizeRole, ROLES } from "../../utils/roles";
import { useDoctorPortalStore } from "../../store/doctorPortalStore";

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
  const role = normalizeRole(user?.role);
  const isDoctor = role === ROLES.DOCTOR;
  const isManager = [ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER, ROLES.DOCTOR].includes(role);
  const { patients: operationalPatients, fetchPatients } = usePatientStore();
  const doctorPortal = useDoctorPortalStore((state) => state.data);
  const fetchDoctorPortal = useDoctorPortalStore((state) => state.fetchPortal);
  const patients = useMemo(
    () => isDoctor ? doctorPortal?.patients || [] : operationalPatients,
    [doctorPortal?.patients, isDoctor, operationalPatients]
  );
  const { notifications, unreadCount, loading, fetchNotifications, sendNotification, updateNotification, deleteNotification, markRead, markAllRead } = useNotificationStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", type: "Dialysis Schedule", title: "Next dialysis session", message: "", scheduledFor: "" });

  useEffect(() => {
    fetchNotifications();
    if (isDoctor) fetchDoctorPortal().catch(() => {});
    else if (isManager) fetchPatients();
  }, [fetchNotifications, fetchPatients, fetchDoctorPortal, isDoctor, isManager]);

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
      setComposerOpen(false);
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
    setComposerOpen(true);
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
    const archiveCutoff = new Date();
    archiveCutoff.setMonth(archiveCutoff.getMonth() - 1);
    return notifications.filter((item) => {
      const isArchived = new Date(item.createdAt) < archiveCutoff;
      return isArchived === showArchived && matchesSearch(search, [
        item.title,
        item.message,
        item.type,
        item.patient?.patient_id,
        item.patient?.first_name,
        item.patient?.middle_name,
        item.patient?.last_name,
        item.status,
        item.scheduledFor,
        item.createdAt,
        JSON.stringify(item),
      ]);
    });
  }, [notifications, search, showArchived]);
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
    <div className="flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-3 overflow-hidden md:h-full">
      <div className="shrink-0"><Topbar title={isManager ? "Patient Alerts" : "My Alerts"} /></div>

      {isManager && (
        <Modal isOpen={composerOpen} title={editingId ? "Edit Patient Alert" : "Send Patient Alert"} maxWidth="max-w-2xl" onClose={() => !sending && setComposerOpen(false)}>
        <form onSubmit={submitAlert} className="space-y-2">
          <div className="grid items-start gap-2 md:grid-cols-2">
            <label className="relative block w-full space-y-0.5 text-xs font-semibold text-blue-700">Patient
              <div className="relative w-full">
                <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
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
                  className="h-6 w-full rounded-md border border-slate-200 bg-white py-0 pl-7 pr-2 text-xs font-normal text-black outline-none placeholder:text-slate-400 focus:border-slate-400"
                />
                {patientPickerOpen && (
                  <div className="absolute z-20 mt-0.5 max-h-36 w-full overflow-y-auto rounded-md bg-white shadow-lg">
                    {!editingId && (
                      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={selectAllPatients} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-900 hover:bg-slate-100">
                        {isDoctor ? "All Assigned Patients" : "All Patients"}
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
            <label className="block w-full space-y-0.5 text-xs font-semibold text-blue-700">Alert type
              <select value={form.type} onChange={(event) => {
                const type = event.target.value;
                setForm((value) => ({ ...value, type, title: type === "Dialysis Schedule" ? "Next dialysis session" : "" }));
              }} className="h-6 w-full rounded-md border border-slate-200 bg-white px-2 py-0 text-xs text-black outline-none">
                <option>Dialysis Schedule</option><option>General Alert</option>
              </select>
            </label>
            <Input label="Title" required maxLength={120} value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} />
            {form.type === "Dialysis Schedule" && <Input label="Session date" type="date" required value={form.scheduledFor} onChange={(event) => setForm((value) => ({ ...value, scheduledFor: event.target.value }))} />}
            <label className="block w-full space-y-0.5 text-xs font-semibold text-blue-700 md:col-span-2">Message <span className="font-normal text-slate-400">(optional)</span>
              <textarea maxLength={1000} rows={3} value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} className="min-h-20 max-h-48 w-full resize-y rounded-md border border-slate-200 px-2 py-1.5 text-xs text-black outline-none placeholder:text-slate-400 focus:border-slate-400" placeholder="Add instructions or details..." />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
            <Button type="submit" disabled={sending}>{sending ? "Saving..." : editingId ? "Save changes" : "Send alert"}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={() => { setEditingId(""); setPatientSearch(""); setForm({ patientId: "", type: "Dialysis Schedule", title: "Next dialysis session", message: "", scheduledFor: "" }); }}><span className="inline-flex items-center gap-2"><X size={16} /> Cancel edit</span></Button>}
          </div>
        </form>
        </Modal>
      )}

      <div className="flex min-w-0 shrink-0 flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-56 sm:max-w-full">
          <Search size={13} className="text-slate-400" /><input placeholder="Search alerts..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full bg-transparent text-[10px] outline-none" />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="secondary" onClick={() => { setShowArchived((value) => !value); setPage(1); }}><span className="inline-flex items-center gap-1">{showArchived ? <List size={12} /> : <Archive size={12} />}{showArchived ? "Active Alerts" : "Archive"}</span></Button>
          {isManager && <Button onClick={() => { setEditingId(""); setPatientSearch(""); setForm({ patientId: "", type: "Dialysis Schedule", title: "Next dialysis session", message: "", scheduledFor: "" }); setComposerOpen(true); }}><span className="inline-flex items-center gap-1"><Send size={12} /> Send Alert</span></Button>}
        </div>
        {!isManager && unreadCount > 0 && <Button variant="secondary" onClick={markAllRead}><span className="inline-flex items-center gap-2"><CheckCheck size={16} /> Mark all read</span></Button>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-white shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading && <p className="p-10 text-center text-sm text-slate-400">Loading alerts...</p>}
        {!loading && visible.length === 0 && <p className="p-10 text-center text-sm text-slate-400">No alerts found.</p>}
        <div className="divide-y divide-slate-100">
          {visible.map((item) => (
            <div key={item._id} onClick={() => !isManager && !item.isRead && markRead(item._id)} className={`flex w-full gap-2 p-2.5 text-left transition hover:bg-slate-50 ${!isManager && !item.isRead ? "cursor-pointer bg-blue-50/60" : ""}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${item.type === "Dialysis Schedule" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{item.type === "Dialysis Schedule" ? <CalendarClock size={14} /> : <BellRing size={14} />}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5"><h3 className="text-xs font-bold text-slate-900">{item.title}</h3>{!isManager && !item.isRead && <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[8px] font-bold text-white">NEW</span>}</div>
                {isManager && <p className="text-[10px] font-semibold text-slate-500">{item.patient?.patient_id} — {getPatientName(item.patient)}</p>}
                {item.scheduledFor && <p className="mt-1 text-sm font-extrabold text-emerald-700">{new Date(item.scheduledFor).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</p>}
                {item.message && <p className="mt-1 text-xs text-slate-600">{item.message}</p>}
                <p className="mt-1 text-[9px] text-slate-400">Sent {new Date(item.createdAt).toLocaleString()}</p>
              </div>
              {isManager && <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => editAlert(item)} aria-label="Edit alert" className="grid h-6 w-6 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"><Pencil size={12} /></button>
                <button type="button" onClick={() => removeAlert(item)} aria-label="Delete alert" className="grid h-6 w-6 place-items-center rounded-md bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={12} /></button>
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
