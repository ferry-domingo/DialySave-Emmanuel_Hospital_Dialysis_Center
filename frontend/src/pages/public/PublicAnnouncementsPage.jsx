import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight, Megaphone, Search } from "lucide-react";
import api from "../../api/axios";
import AnnouncementImageSlider from "../../components/common/AnnouncementImageSlider";
import Modal from "../../components/common/Modal";

const PublicAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.get("/announcements/public", { params: { preview: 1 } })
      .then(({ data }) => setAnnouncements(data.data))
      .catch(() => setError("Announcements are temporarily unavailable."))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return announcements.filter((item) => !query || `${item.title} ${item.message}`.toLowerCase().includes(query));
  }, [announcements, search]);
  const pageSize = 16;
  const pageCount = Math.ceil(visible.length / pageSize);
  const paginatedAnnouncements = visible.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  return <>
    <section className="info-hero announcements-hero"><div className="info-hero-overlay"/><div className="public-container"><p className="public-eyebrow"><Megaphone size={16} /> Center updates</p><h1>Announcements</h1><p>News, schedules, reminders, and important updates from Emmanuel Hospital Dialysis Center.</p></div></section>
    <section className="public-section bg-slate-50"><div className="public-container">
      <div className="mb-5 flex items-center justify-between gap-3"><div className="flex h-10 w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm"><Search size={15} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search announcements..." className="w-full bg-transparent text-xs outline-none" /></div>{pageCount > 1 && <nav aria-label="Announcement pages" className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))} disabled={page === 0} aria-label="Previous announcement page" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={18} /></button><button type="button" onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))} disabled={page >= pageCount - 1} aria-label="Next announcement page" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight size={18} /></button></nav>}</div>
      {loading && <p className="rounded-2xl bg-white p-12 text-center text-slate-400">Loading announcements...</p>}
      {error && <p className="rounded-2xl bg-red-50 p-5 text-center font-semibold text-red-700">{error}</p>}
      {!loading && !error && visible.length === 0 && <p className="rounded-2xl bg-white p-12 text-center text-slate-400">No announcements found.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{paginatedAnnouncements.map((item) => <article key={item._id} role="button" tabIndex={0} onClick={() => setSelectedAnnouncement(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedAnnouncement(item); } }} className="flex min-h-[360px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
        {item.media?.[0] ? <div className="relative h-52 shrink-0 overflow-hidden border-b border-slate-100 bg-slate-900"><img src={item.media[0].dataUrl} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-md" /><div className="relative z-10 grid h-full w-full place-items-center bg-slate-950/10"><img src={item.media[0].dataUrl} alt={item.media[0].name || item.title} loading="lazy" className="h-full w-full object-contain" style={{ objectFit: "contain", objectPosition: "center" }} /></div></div> : <div className="grid h-52 shrink-0 place-items-center bg-emerald-50 text-emerald-200"><Megaphone size={40} /></div>}
        <div className="flex flex-1 flex-col p-3"><time className="flex items-center gap-1 text-[8px] font-medium text-slate-400"><CalendarClock size={9} />{new Date(item.createdAt).toLocaleDateString()}</time><h2 className="mt-2 line-clamp-2 text-sm font-black leading-tight text-slate-950">{item.title}</h2><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-600">{item.message}</p><span className="mt-auto flex items-center gap-1 border-t border-slate-100 pt-3 text-[10px] font-bold text-emerald-700">Read announcement <ArrowRight size={11} /></span></div>
      </article>)}</div>
      {pageCount > 1 && <p className="mt-4 text-center text-[10px] font-semibold text-slate-400">Page {page + 1} of {pageCount}</p>}
    </div></section>
    <Modal isOpen={Boolean(selectedAnnouncement)} onClose={() => setSelectedAnnouncement(null)} title={selectedAnnouncement?.title || "Announcement"} maxWidth="max-w-3xl">
      {selectedAnnouncement && <div className="space-y-4"><p className="flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarClock size={12} />Posted {new Date(selectedAnnouncement.createdAt).toLocaleString()}</p><AnnouncementImageSlider media={selectedAnnouncement.media} title={selectedAnnouncement.title} /><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{selectedAnnouncement.message}</p></div>}
    </Modal>
  </>;
};

export default PublicAnnouncementsPage;
