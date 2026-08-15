import { useEffect, useState } from "react";
import { ImagePlus, Pencil, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Topbar from "../../components/layout/Topbar";
import Modal from "../../components/common/Modal";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const TechnologyGalleryPage = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("technology");
  const [viewing, setViewing] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", caption: "", category: "technology" });
  const [saving, setSaving] = useState(false);

  const loadPhotos = async () => {
    try {
      const { data } = await api.get("/technology-gallery");
      setPhotos(data.data);
    } catch {
      toast.error("Could not load technology photos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPhotos(); }, []);

  const upload = async (event) => {
    const files = [...event.target.files];
    event.target.value = "";
    if (!files.length) return;
    if (photos.length + files.length > 20) return toast.error("The gallery can contain up to 20 photos.");
    if (files.some((file) => !ALLOWED_TYPES.includes(file.type) || file.size > 6 * 1024 * 1024)) return toast.error("Use JPG, PNG, WebP, or GIF images smaller than 6 MB each.");
    setUploading(true);
    try {
      for (const file of files) {
        await api.post("/technology-gallery", { name: file.name, mimeType: file.type, dataUrl: await readFile(file), category: uploadCategory });
      }
      toast.success(`${files.length} ${files.length === 1 ? "photo" : "photos"} uploaded.`);
      await loadPhotos();
      setUploadOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (photo) => {
    if (!window.confirm(`Delete "${photo.name}"?`)) return;
    try {
      const { data } = await api.delete(`/technology-gallery/${photo._id}`);
      setPhotos((current) => current.filter((item) => item._id !== photo._id));
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete photo.");
    }
  };

  const toggleHome = async (photo) => {
    try {
      const { data } = await api.patch(`/technology-gallery/${photo._id}/home`, { showOnHome: !photo.showOnHome });
      setPhotos((current) => current.map((item) => item._id === photo._id ? { ...item, showOnHome: data.data.showOnHome } : item));
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update the Home showcase.");
    }
  };

  const beginEdit = (photo) => {
    setEditing(photo);
    setEditForm({ name: photo.name, caption: photo.caption || "", category: photo.category || "technology" });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(`/technology-gallery/${editing._id}`, editForm);
      setPhotos((current) => current.map((item) => item._id === editing._id ? { ...item, ...data.data } : item));
      setEditing(null);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update photo.");
    } finally {
      setSaving(false);
    }
  };

  const categoryLimitReached = photos.length >= 20;
  const homeSelectionCount = photos.filter((photo) => photo.showOnHome).length;
  const filteredPhotos = filter === "all" ? photos : photos.filter((photo) => photo.category === filter);
  const openPreview = (photo) => {
    setZoomed(false);
    setViewing(photo);
  };

  return <div className="min-w-0 space-y-3 xl:flex xl:h-full xl:flex-col xl:overflow-hidden">
    <Topbar title="Gallery Management" />
    <Modal isOpen={Boolean(viewing)} title={viewing?.caption || viewing?.name || "Photo preview"} maxWidth="max-w-6xl" onClose={() => setViewing(null)}>
      {viewing && <button type="button" onClick={() => setZoomed((value) => !value)} aria-label={zoomed ? "Zoom out image" : "Zoom in image"} className={`flex h-[78vh] min-h-64 w-full items-center justify-center overflow-auto rounded-xl bg-slate-950 p-3 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}><img src={viewing.imageUrl} alt={viewing.caption || viewing.name} className="max-h-full max-w-full object-contain transition-transform duration-200" style={{ transform: `scale(${zoomed ? 2 : 1})` }} /></button>}
    </Modal>
    <Modal isOpen={uploadOpen} title="Upload gallery photos" maxWidth="max-w-lg" onClose={() => !uploading && setUploadOpen(false)}>
      <div className="space-y-4">
        <label className="block text-xs font-semibold text-slate-700">Photo category<select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"><option value="technology">Facilities & Technology page</option><option value="organization">Organization activities</option><option value="training">Training</option></select></label>
        <label className={`flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-emerald-400 hover:bg-emerald-50 ${uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}><span className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-600"><ImagePlus size={26} />{uploading ? "Uploading photos..." : "Choose one or multiple photos"}<small className="font-normal text-slate-400">JPG, PNG, WebP, or GIF; up to 6 MB each</small></span><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} className="hidden" /></label>
        <div className="flex justify-end border-t border-slate-100 pt-3"><button type="button" onClick={() => setUploadOpen(false)} disabled={uploading} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button></div>
      </div>
    </Modal>
    <Modal isOpen={Boolean(editing)} title="Edit gallery photo" maxWidth="max-w-lg" onClose={() => !saving && setEditing(null)}>
      <form onSubmit={saveEdit} className="space-y-4">
        <label className="block text-xs font-semibold text-slate-700">Display name<input required maxLength={180} value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label>
        <label className="block text-xs font-semibold text-slate-700">Caption<input maxLength={120} value={editForm.caption} onChange={(event) => setEditForm({ ...editForm, caption: event.target.value })} placeholder="Optional public image description" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label>
        <label className="block text-xs font-semibold text-slate-700">Category<select value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"><option value="technology">Facilities & Technology page</option><option value="organization">Organization activities</option><option value="training">Training</option></select></label>
        {editing?.showOnHome && editForm.category !== "technology" && <p className="rounded-lg bg-amber-50 p-3 text-[10px] font-semibold text-amber-800">Moving this photo will also remove it from the Home showcase.</p>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button></div>
      </form>
    </Modal>
    <section className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div><h1 className="text-sm font-extrabold text-slate-900">Public facilities and gallery sliders</h1><p className="mt-1 text-[10px] text-slate-500">Select up to 5 existing Facilities photos for the Home showcase. Selected: {homeSelectionCount}/5.</p></div>
      <div className="flex items-center gap-2"><label className="text-[10px] font-bold text-slate-500">Filter<select value={filter} onChange={(event) => setFilter(event.target.value)} className="ml-2 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"><option value="all">All photos</option><option value="technology">Facilities & Technology</option><option value="organization">Organization activities</option><option value="training">Training</option></select></label><button type="button" onClick={() => setUploadOpen(true)} disabled={categoryLimitReached} className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><ImagePlus size={15} />Upload photos</button></div>
    </section>
    <section className="grid min-h-0 auto-rows-max content-start items-start gap-3 overflow-y-auto pb-1 [scrollbar-width:none] sm:grid-cols-2 lg:grid-cols-3 xl:flex-1 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
      {loading && <p className="col-span-full rounded-xl bg-white p-10 text-center text-sm text-slate-400">Loading gallery...</p>}
      {!loading && !photos.length && <p className="col-span-full rounded-xl bg-white p-10 text-center text-sm text-slate-400">No uploaded photos. The public page is using its default image.</p>}
      {!loading && photos.length > 0 && !filteredPhotos.length && <p className="col-span-full rounded-xl bg-white p-10 text-center text-sm text-slate-400">No photos in this category.</p>}
      {filteredPhotos.map((photo) => <article key={photo._id} className={`w-full self-start overflow-hidden rounded-xl border bg-white shadow-sm ${photo.showOnHome ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"}`}><button type="button" onClick={() => openPreview(photo)} className="relative block aspect-[4/3] w-full cursor-zoom-in bg-slate-100" aria-label={`View ${photo.name}`}><img src={photo.imageUrl} alt={photo.caption || photo.name} className="h-full w-full object-contain" />{photo.showOnHome && <span className="absolute left-2 top-2 rounded-md bg-amber-400 px-2 py-1 text-[8px] font-black uppercase text-slate-950">Home selected</span>}</button><div className="flex items-center gap-2 p-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700" title={photo.name}>{photo.name}</p><p className="mt-1 text-[8px] font-bold uppercase text-emerald-700">{photo.category === "technology" ? "Facilities & Technology" : photo.category === "organization" ? "Organization activity" : photo.category}</p></div><button type="button" onClick={() => beginEdit(photo)} aria-label={`Edit ${photo.name}`} title="Edit photo" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 transition hover:bg-blue-100"><Pencil size={14} /></button>{photo.category === "technology" && <button type="button" onClick={() => toggleHome(photo)} aria-label={photo.showOnHome ? `Remove ${photo.name} from Home` : `Show ${photo.name} on Home`} title={photo.showOnHome ? "Remove from Home" : "Show on Home"} disabled={!photo.showOnHome && homeSelectionCount >= 5} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-35 ${photo.showOnHome ? "bg-amber-400 text-slate-950" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}><Star size={14} fill={photo.showOnHome ? "currentColor" : "none"} /></button>}<button type="button" onClick={() => remove(photo)} aria-label={`Delete ${photo.name}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={14} /></button></div></article>)}
    </section>
  </div>;
};

export default TechnologyGalleryPage;
