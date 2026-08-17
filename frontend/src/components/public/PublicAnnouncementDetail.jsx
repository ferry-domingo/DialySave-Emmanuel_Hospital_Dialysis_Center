import { CalendarClock, Megaphone, ShieldCheck } from "lucide-react";
import AnnouncementImageSlider from "../common/AnnouncementImageSlider";

const formatPostedAt = (value) => new Intl.DateTimeFormat("en-PH", {
  dateStyle: "long",
  timeStyle: "short",
}).format(new Date(value));

const PublicAnnouncementDetail = ({ announcement }) => {
  if (!announcement) return null;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#123d31] via-[#185440] to-[#0d3026] px-5 py-5 text-white sm:px-6">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-300/15 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-300/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-amber-100"><Megaphone size={12} /> Center update</span>
            <time className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-50/80"><CalendarClock size={13} />{formatPostedAt(announcement.createdAt)}</time>
          </div>
          <h2 className="mt-4 max-w-2xl text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">{announcement.title}</h2>
        </div>
      </header>

      {announcement.media?.length > 0 && <div className="bg-[#eef3f0] p-3 sm:p-4"><AnnouncementImageSlider media={announcement.media} title={announcement.title} /></div>}

      <section className="px-5 py-5 sm:px-6">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-emerald-800"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Megaphone size={14} /></span>Announcement details</div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{announcement.message}</p>
      </section>

      <footer className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-semibold text-slate-500 sm:px-6">
        <ShieldCheck size={14} className="text-emerald-700" /> Official update from Emmanuel Hospital Dialysis Center
      </footer>
    </article>
  );
};

export default PublicAnnouncementDetail;
