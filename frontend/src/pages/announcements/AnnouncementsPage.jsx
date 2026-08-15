import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ImagePlus, Megaphone, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/common/Button";
import AnnouncementImageSlider from "../../components/common/AnnouncementImageSlider";
import Modal from "../../components/common/Modal";
import Topbar from "../../components/layout/Topbar";
import { useAnnouncementStore } from "../../store/announcementStore";
import { useAuthStore } from "../../store/authStore";
import { normalizeRole, ROLES } from "../../utils/roles";

const AUDIENCES = [ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER, ROLES.PATIENT, ROLES.DOCTOR];
const emptyForm = { title: "", message: "", media: [], audience: AUDIENCES, isActive: true };
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const readFile = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });

const AnnouncementsPage = () => {
  const role = normalizeRole(useAuthStore((state) => state.user?.role));
  const isAdmin = role === ROLES.ADMIN;
  const { announcements, loading, error, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncementStore();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return announcements.filter((item) => !query || [item.title, item.message, ...(item.audience || [])].join(" ").toLowerCase().includes(query));
  }, [announcements, search]);

  const beginCreate = () => { setEditingId(""); setForm({ ...emptyForm, audience: [...AUDIENCES], media: [] }); setOpen(true); };
  const beginEdit = (item) => {
    setEditingId(item._id);
    setForm({ title: item.title, message: item.message, media: item.media || [], audience: [...AUDIENCES], isActive: true });
    setOpen(true);
  };
  const addMedia = async (event) => {
    const files = [...event.target.files];
    event.target.value = "";
    if (form.media.length + files.length > 4) return toast.error("Up to 4 photos per post.");
    if (files.some((file) => !ALLOWED_MEDIA.includes(file.type))) return toast.error("Use JPG, PNG, WebP, or GIF images.");
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0) + form.media.reduce((sum, item) => sum + Math.ceil((item.dataUrl?.length || 0) * 0.75), 0);
    if (totalBytes > 8 * 1024 * 1024) return toast.error("Combined media must be smaller than 8 MB.");
    try {
      const added = await Promise.all(files.map(async (file) => ({ kind: "image", mimeType: file.type, name: file.name, dataUrl: await readFile(file) })));
      setForm((current) => ({ ...current, media: [...current.media, ...added] }));
    } catch { toast.error("Could not read the selected file."); }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = editingId ? await updateAnnouncement(editingId, form) : await createAnnouncement(form);
      toast.success(result.message);
      setOpen(false);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not save announcement.");
    } finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try { const result = await deleteAnnouncement(item._id); toast.success(result.message); }
    catch (requestError) { toast.error(requestError.response?.data?.message || "Could not delete announcement."); }
  };

  return <div className="announcements-page min-w-0 max-w-full space-y-2 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:gap-2 xl:overflow-hidden">
    <Topbar title="Announcements" />
    {isAdmin && <Modal isOpen={open} title={editingId ? "Edit announcement" : "New announcement"} maxWidth="max-w-2xl" onClose={() => !saving && setOpen(false)}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Title<input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600" /></label>
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Message<textarea required maxLength={2000} rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="mt-1 w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-600" /></label>
          <div className="sm:col-span-2"><p className="text-xs font-semibold text-slate-700">Photos <span className="font-normal text-slate-400">(up to 4, 8 MB total)</span></p><p className="mt-0.5 text-[10px] text-slate-400">Images will be shown in full without cropping.</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{form.media.map((item, index) => <div key={`${item.name}-${index}`} className="relative aspect-video overflow-hidden rounded-lg border border-slate-300 bg-slate-900"><img src={item.dataUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-md" /><div className="relative z-10 grid h-full w-full place-items-center bg-slate-950/15 p-1.5"><img src={item.dataUrl} alt={item.name || `Announcement photo ${index + 1}`} className="h-full w-full object-contain" style={{ objectFit: "contain", objectPosition: "center" }} /></div><button type="button" onClick={() => setForm((current) => ({ ...current, media: current.media.filter((_, mediaIndex) => mediaIndex !== index) }))} className="absolute right-1 top-1 z-20 grid h-6 w-6 place-items-center rounded-full bg-slate-950/75 text-white"><X size={12} /></button></div>)}{form.media.length < 4 && <label className="grid aspect-video cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"><span className="flex flex-col items-center gap-1 text-[10px] font-semibold"><ImagePlus size={20} /> Add photos</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={addMedia} className="hidden" /></label>}</div></div>
          <p className="flex items-end pb-2 text-xs text-slate-400 sm:col-span-2">The post date and time are added automatically.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Publish"}</Button></div>
      </form>
    </Modal>}

    <Modal isOpen={Boolean(selectedAnnouncement)} title={selectedAnnouncement?.title || "Announcement"} maxWidth="max-w-3xl" onClose={() => setSelectedAnnouncement(null)}>
      {selectedAnnouncement && <article className="space-y-4">
        <AnnouncementImageSlider media={selectedAnnouncement.media} title={selectedAnnouncement.title} />
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{selectedAnnouncement.message}</p>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <time dateTime={selectedAnnouncement.createdAt} className="inline-flex items-center gap-1.5"><CalendarClock size={13} />{new Date(selectedAnnouncement.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</time>
          {selectedAnnouncement.media?.length > 0 && <span>{selectedAnnouncement.media.length} {selectedAnnouncement.media.length === 1 ? "photo" : "photos"}</span>}
        </footer>
      </article>}
    </Modal>

    <section className="shrink-0 rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10"><Search size={14} className="shrink-0 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search announcements..." className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"><X size={12} /></button>}</div>
          <span className="hidden whitespace-nowrap text-xs font-medium text-slate-400 lg:block">{visible.length} {visible.length === 1 ? "announcement" : "announcements"}</span>
        </div>
        {isAdmin && <Button onClick={beginCreate}><span className="inline-flex items-center justify-center gap-1.5"><Plus size={16} /> New announcement</span></Button>}
      </div>
    </section>

    {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    <section className="grid min-h-0 w-full content-start items-start gap-4 overflow-y-auto pr-1 [scrollbar-width:none] sm:grid-cols-2 [&::-webkit-scrollbar]:hidden md:grid-cols-3 lg:grid-cols-4 xl:flex-1 xl:grid-cols-5">
      {loading && <p className="col-span-full rounded-xl bg-white p-10 text-center text-sm text-slate-400">Loading announcements...</p>}
      {!loading && !visible.length && <p className="col-span-full rounded-xl bg-white p-10 text-center text-sm text-slate-400">No announcements found.</p>}
      {visible.map((item) => {
        const createdAt = new Date(item.createdAt);
        return <article key={item._id} role="button" tabIndex={0} aria-label={`View full announcement: ${item.title}`} onClick={() => setSelectedAnnouncement(item)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedAnnouncement(item); } }} className="flex min-h-[400px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
          {item.media?.[0] ? <div className="relative h-60 min-h-0 min-w-0 shrink-0 overflow-hidden border-b border-slate-100 bg-slate-900"><img src={item.media[0].dataUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-md" /><div className="relative z-10 grid h-full w-full place-items-center bg-slate-950/15"><img src={item.media[0].dataUrl} alt={item.media[0].name || item.title} loading="lazy" className="block h-full w-full object-contain" style={{ objectFit: "contain", objectPosition: "center" }} /></div>{item.media.length > 1 && <span className="absolute bottom-2 right-2 z-20 rounded-full bg-slate-950/75 px-2 py-0.5 text-[8px] font-bold text-white">+{item.media.length - 1}</span>}</div> : <div className="grid h-60 shrink-0 place-items-center bg-emerald-50 text-emerald-700"><Megaphone size={44} /></div>}
          <div className="flex min-w-0 flex-1 flex-col p-3"><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><time dateTime={item.createdAt} className="inline-flex items-center gap-1 text-[8px] font-medium text-slate-400"><CalendarClock size={9} />{createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>{item.media?.length > 0 && <span className="text-[8px] font-medium text-slate-400">{item.media.length} {item.media.length === 1 ? "photo" : "photos"}</span>}</div>{isAdmin && <div className="flex shrink-0 gap-1"><button onClick={(event) => { event.stopPropagation(); beginEdit(item); }} aria-label="Edit announcement" title="Edit" className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"><Pencil size={12} /></button><button onClick={(event) => { event.stopPropagation(); remove(item); }} aria-label="Delete announcement" title="Delete" className="grid h-7 w-7 place-items-center rounded-md border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"><Trash2 size={12} /></button></div>}</div><h2 className="mt-2 line-clamp-2 min-w-0 text-sm font-extrabold leading-tight text-slate-950">{item.title}</h2><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-600">{item.message}</p><span className="mt-auto flex items-center gap-1 border-t border-slate-100 pt-3 text-[10px] font-bold text-emerald-700">View announcement <ArrowRight size={11} /></span></div>
        </article>;
      })}
    </section>
  </div>;
};

export default AnnouncementsPage;
