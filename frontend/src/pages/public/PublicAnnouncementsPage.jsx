import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Megaphone, Search } from "lucide-react";
import api from "../../api/axios";

const PublicAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
    <section className="public-section bg-slate-50"><div className="public-container max-w-3xl">
      <div className="mb-6 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 shadow-sm"><Search size={17} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search announcements..." className="w-full bg-transparent text-sm outline-none" /></div>
      {loading && <p className="rounded-2xl bg-white p-12 text-center text-slate-400">Loading announcements...</p>}
      {error && <p className="rounded-2xl bg-red-50 p-5 text-center font-semibold text-red-700">{error}</p>}
      {!loading && !error && visible.length === 0 && <p className="rounded-2xl bg-white p-12 text-center text-slate-400">No announcements found.</p>}
      <div className="space-y-4">{visible.map((item) => <article key={item._id} className={`overflow-hidden rounded-xl border bg-white shadow-sm ${item.priority === "Urgent" ? "border-red-200" : item.priority === "Important" ? "border-amber-200" : "border-slate-200"}`}>
        <div className="p-4 sm:p-5"><div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${item.priority === "Urgent" ? "bg-red-50 text-red-600" : item.priority === "Important" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{item.priority === "Urgent" ? <AlertTriangle size={17} /> : <Megaphone size={17} />}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-black text-slate-950">{item.title}</h2>{item.priority !== "Normal" && <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${item.priority === "Urgent" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{item.priority}</span>}</div><p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarClock size={11} /> Posted {new Date(item.createdAt).toLocaleString()}</p></div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.message}</p></div>
        {item.media?.length > 0 && <div className={`grid gap-1 border-t border-slate-100 bg-slate-950 ${item.media.length > 1 ? "sm:grid-cols-2" : ""}`}>{item.media.map((media, index) => <div key={index} className="grid max-h-[440px] place-items-center overflow-hidden bg-slate-950"><img src={media.dataUrl} alt={media.name || item.title} loading="lazy" className="max-h-[440px] w-full object-contain" /></div>)}</div>}
      </article>)}</div>
    </div></section>
  </>;
};

export default PublicAnnouncementsPage;
