import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Megaphone, Search } from "lucide-react";
import api from "../../api/axios";
import Modal from "../../components/common/Modal";

const PublicAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    api.get("/announcements/public")
      .then(({ data }) => setAnnouncements(data.data))
      .catch(() => setError("Announcements are temporarily unavailable."))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return announcements.filter((item) => !query || `${item.title} ${item.message}`.toLowerCase().includes(query));
  }, [announcements, search]);

  return <>
    <section className="info-hero"><div className="public-container"><p className="public-eyebrow"><Megaphone size={16} /> Center updates</p><h1>Announcements</h1><p>News, schedules, reminders, and important updates from Emmanuel Hospital Dialysis Center.</p></div></section>
    <section className="public-section bg-slate-50"><div className="public-container">
      <div className="mb-5 flex h-10 max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm"><Search size={15} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search announcements..." className="w-full bg-transparent text-xs outline-none" /></div>
      {loading && <p className="rounded-2xl bg-white p-12 text-center text-slate-400">Loading announcements...</p>}
      {error && <p className="rounded-2xl bg-red-50 p-5 text-center font-semibold text-red-700">{error}</p>}
      {!loading && !error && visible.length === 0 && <p className="rounded-2xl bg-white p-12 text-center text-slate-400">No announcements found.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((item) => <article key={item._id} role="button" tabIndex={0} onClick={() => setSelectedAnnouncement(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedAnnouncement(item); } }} className="flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
        {item.media?.[0] ? <div className="grid h-36 place-items-center overflow-hidden border-b border-slate-100 bg-white p-2"><img src={item.media[0].dataUrl} alt={item.media[0].name || item.title} loading="lazy" className="h-full w-full object-contain" /></div> : <div className="grid h-36 place-items-center bg-emerald-50 text-emerald-200"><Megaphone size={32} /></div>}
        <div className="flex flex-1 flex-col p-3"><div className="flex items-start gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Megaphone size={13} /></span><div className="min-w-0"><h2 className="line-clamp-1 text-sm font-black text-slate-950">{item.title}</h2><p className="mt-0.5 flex items-center gap-1 text-[8px] text-slate-400"><CalendarClock size={9} />{new Date(item.createdAt).toLocaleDateString()}</p></div></div><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-600">{item.message}</p><span className="mt-3 border-t border-slate-100 pt-2 text-[10px] font-bold text-emerald-700">View full announcement</span></div>
      </article>)}</div>
    </div></section>
    <Modal isOpen={Boolean(selectedAnnouncement)} onClose={() => setSelectedAnnouncement(null)} title={selectedAnnouncement?.title || "Announcement"} maxWidth="max-w-3xl">
      {selectedAnnouncement && <div className="space-y-4"><p className="flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarClock size={12} />Posted {new Date(selectedAnnouncement.createdAt).toLocaleString()}</p>{selectedAnnouncement.media?.length > 0 && <div className={`grid gap-2 ${selectedAnnouncement.media.length > 1 ? "sm:grid-cols-2" : ""}`}>{selectedAnnouncement.media.map((media, index) => <div key={index} className="grid max-h-[55vh] min-h-52 place-items-center overflow-hidden rounded-xl bg-slate-50 p-2"><img src={media.dataUrl} alt={media.name || selectedAnnouncement.title} className="max-h-[52vh] h-full w-full object-contain" /></div>)}</div>}<p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{selectedAnnouncement.message}</p></div>}
    </Modal>
  </>;
};

export default PublicAnnouncementsPage;
