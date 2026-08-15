import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, HeartPulse, Megaphone, Microscope, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AnnouncementImageSlider from "../../components/common/AnnouncementImageSlider";
import OneClickImageLightbox from "../../components/common/OneClickImageLightbox";
import Modal from "../../components/common/Modal";

const FacilityShowcaseSlider = () => {
  const [photos, setPhotos] = useState([]);
  const [current, setCurrent] = useState(0);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    api.get("/technology-gallery").then(({ data }) => setPhotos(data.data.filter((photo) => photo.showOnHome).slice(0, 5))).catch(() => setPhotos([]));
  }, []);

  if (!photos.length) return <div className="public-showcase-image" />;
  const move = (direction) => setCurrent((index) => (index + direction + photos.length) % photos.length);

  return <div className="facility-showcase-slider" aria-roledescription="carousel" aria-label="Facilities gallery">
    {photos.map((photo, index) => <img key={photo._id} src={photo.imageUrl} alt={photo.caption || `Facility photo ${index + 1}`} className={index === current ? "active" : ""} aria-hidden={index !== current} role={index === current ? "button" : undefined} tabIndex={index === current ? 0 : -1} onClick={() => index === current && setPreview({ src: photo.imageUrl, alt: photo.caption || `Facility photo ${index + 1}` })} onKeyDown={(event) => { if (index === current && (event.key === "Enter" || event.key === " ")) setPreview({ src: photo.imageUrl, alt: photo.caption || `Facility photo ${index + 1}` }); }} />)}
    {photos.length > 1 && <><button type="button" className="previous" onClick={() => move(-1)} aria-label="Previous facility photo"><ChevronLeft /></button><button type="button" className="next" onClick={() => move(1)} aria-label="Next facility photo"><ChevronRight /></button><div className="facility-showcase-dots">{photos.map((photo, index) => <button key={photo._id} type="button" className={index === current ? "active" : ""} onClick={() => setCurrent(index)} aria-label={`Show facility photo ${index + 1}`} />)}</div></>}
    <OneClickImageLightbox image={preview} onClose={() => setPreview(null)} />
  </div>;
};

const LandingPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(false);
  const [announcementPage, setAnnouncementPage] = useState(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isMobileAnnouncements, setIsMobileAnnouncements] = useState(() => window.matchMedia("(max-width: 600px)").matches);

  useEffect(() => {
    api.get("/announcements/public", { params: { preview: 1 } })
      .then(({ data }) => setAnnouncements(data.data))
      .catch(() => {
        setAnnouncements([]);
        setAnnouncementsError(true);
      })
      .finally(() => setAnnouncementsLoading(false));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 600px)");
    const updateLayout = (event) => setIsMobileAnnouncements(event.matches);
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  const announcementPageSize = 5;
  const announcementPageCount = Math.ceil(announcements.length / announcementPageSize);
  const visibleAnnouncements = isMobileAnnouncements
    ? announcements
    : announcements.slice(
      announcementPage * announcementPageSize,
      (announcementPage + 1) * announcementPageSize
    );

  useEffect(() => {
    const section = document.querySelector(".public-hero + .public-section");
    const track = section?.querySelector(".public-container > .grid");
    const previousButton = section?.querySelector('[aria-label="View newer announcements"]');
    const nextButton = section?.querySelector('[aria-label="View older announcements"]');
    if (!track || !previousButton || !nextButton) return undefined;

    const isMobile = () => window.matchMedia("(max-width: 600px)").matches;
    const updateButtons = () => {
      if (!isMobile()) return;
      previousButton.disabled = track.scrollLeft <= 2;
      nextButton.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    const scrollOneCard = (direction) => (event) => {
      if (!isMobile()) return;
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent?.stopImmediatePropagation?.();
      const card = track.querySelector("article");
      track.scrollBy({ left: direction * ((card?.offsetWidth || track.clientWidth) + 12), behavior: "smooth" });
    };
    const scrollPrevious = scrollOneCard(-1);
    const scrollNext = scrollOneCard(1);

    previousButton.addEventListener("click", scrollPrevious, true);
    nextButton.addEventListener("click", scrollNext, true);
    track.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();

    return () => {
      previousButton.removeEventListener("click", scrollPrevious, true);
      nextButton.removeEventListener("click", scrollNext, true);
      track.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [announcements.length, announcementPage, isMobileAnnouncements]);

  return <>
    <section className="public-hero">
      <div className="public-hero-image" />
      <div className="public-hero-overlay" />
      <div className="public-container public-hero-content">
        <p className="public-eyebrow"><HeartPulse size={16} /> Trusted dialysis center since 2009</p>
        <h1>Better dialysis care begins with feeling understood.</h1>
        <p className="public-hero-lead">Modern treatment, attentive clinical teams, and a calm environment—working together around every patient.</p>
        <div className="public-actions"><Link to="/services" className="public-primary">Explore our care <ArrowRight size={17} /></Link><Link to="/contact" className="public-secondary">Plan your visit</Link></div>
      </div>
      <div className="public-hero-stats"><div className="public-hero-stats-track"><div className="public-hero-stat-group"><div><strong>2009</strong><span>Serving our community since</span></div><div><strong>Patient-first</strong><span>Care built around comfort</span></div><div><strong>Modern</strong><span>Dialysis monitoring systems</span></div><div><strong>Advanced</strong><span>Technology-supported care</span></div><div><strong>Facilities</strong><span>Clean, comfortable spaces</span></div></div><div className="public-hero-stat-group" aria-hidden="true"><div><strong>2009</strong><span>Serving our community since</span></div><div><strong>Patient-first</strong><span>Care built around comfort</span></div><div><strong>Modern</strong><span>Dialysis monitoring systems</span></div><div><strong>Advanced</strong><span>Technology-supported care</span></div><div><strong>Facilities</strong><span>Clean, comfortable spaces</span></div></div></div></div>
    </section>

    <section className="public-section bg-slate-50"><div className="public-container"><div className="public-section-heading"><div><p className="public-eyebrow dark"><Megaphone size={15} /> Latest updates</p><h2>Announcements from the center.</h2></div><div className="flex items-center gap-3">{announcementPageCount > 1 && <div className="flex items-center gap-1"><button type="button" onClick={() => setAnnouncementPage((page) => Math.max(0, page - 1))} disabled={announcementPage === 0} aria-label="View newer announcements" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={18} /></button><button type="button" onClick={() => setAnnouncementPage((page) => Math.min(announcementPageCount - 1, page + 1))} disabled={announcementPage >= announcementPageCount - 1} aria-label="View older announcements" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight size={18} /></button></div>}<Link to="/announcements" className="public-text-link">View all announcements <ArrowRight size={16} /></Link></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{announcementsLoading && <div className="col-span-full min-h-40 animate-pulse rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-400">Loading latest announcements...</div>}{!announcementsLoading && announcementsError && <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Announcements are temporarily unavailable. Please check again shortly.</div>}{!announcementsLoading && !announcementsError && announcements.length === 0 && <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">There are no current announcements.</div>}{visibleAnnouncements.map((item) => <article key={item._id} role="button" tabIndex={0} onClick={() => setSelectedAnnouncement(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedAnnouncement(item); } }} className="group flex min-h-[360px] min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"><div className="flex min-w-0 flex-1 flex-col">{item.media?.[0] ? <div className="relative h-52 shrink-0 overflow-hidden bg-slate-900"><img src={item.media[0].dataUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-md" /><div className="relative z-10 grid h-full w-full place-items-center bg-slate-950/15"><img src={item.media[0].dataUrl} alt={item.title} loading="lazy" className="h-full w-full object-contain" style={{ objectFit: "contain", objectPosition: "center" }} /></div></div> : <div className="grid h-52 shrink-0 place-items-center bg-emerald-50 text-emerald-200"><Megaphone size={40} /></div>}<div className="flex min-w-0 flex-1 flex-col p-3"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${item.priority === "Urgent" ? "bg-red-50 text-red-700" : item.priority === "Important" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{item.priority}</span><time className="flex shrink-0 items-center gap-1 text-[8px] text-slate-400"><CalendarClock size={10} />{new Date(item.createdAt).toLocaleDateString()}</time></div><h3 className="mt-2 line-clamp-2 text-sm font-black text-slate-950">{item.title}</h3><p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-4 text-slate-600">{item.message}</p><span className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2.5 text-[10px] font-bold text-emerald-700">Read announcement <ArrowRight size={11} /></span></div></div></article>)}</div>{announcementPageCount > 1 && <p className="mt-4 text-center text-[10px] font-semibold text-slate-400">Page {announcementPage + 1} of {announcementPageCount}</p>}</div></section>

    <Modal isOpen={Boolean(selectedAnnouncement)} onClose={() => setSelectedAnnouncement(null)} title={selectedAnnouncement?.title || "Announcement"} maxWidth="max-w-3xl">
      {selectedAnnouncement && <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${selectedAnnouncement.priority === "Urgent" ? "bg-red-50 text-red-700" : selectedAnnouncement.priority === "Important" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{selectedAnnouncement.priority}</span><time className="flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarClock size={12} />Posted {new Date(selectedAnnouncement.createdAt).toLocaleString()}</time></div><AnnouncementImageSlider media={selectedAnnouncement.media} title={selectedAnnouncement.title} /><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{selectedAnnouncement.message}</p></div>}
    </Modal>

    <section className="public-section public-muted"><div className="public-container"><div className="public-section-heading"><div><p className="public-eyebrow dark">Why patients choose us</p><h2>Everything needed for confident care.</h2></div><Link to="/technology" className="public-text-link">See our facilities <ArrowRight size={16} /></Link></div><div className="public-feature-grid">
      <article><span><Stethoscope /></span><h3>Coordinated treatment</h3><p>Experienced professionals maintain continuity and clear communication throughout each patient’s care.</p></article>
      <article><span><Microscope /></span><h3>Modern technology</h3><p>Contemporary dialysis and monitoring systems help teams deliver precise, closely observed treatment.</p></article>
      <article><span><ShieldCheck /></span><h3>Safety and dignity</h3><p>Thoughtful protocols, clean spaces, and respectful support create confidence at every visit.</p></article>
    </div></div></section>

    <section className="public-showcase"><FacilityShowcaseSlider /><div className="public-showcase-copy"><p className="public-eyebrow">Designed for comfort</p><h2>A calmer space for every treatment.</h2><p>Bright treatment areas, comfortable stations, and attentive staff make longer sessions feel less clinical and more reassuring.</p><ul><li><CheckCircle2 /> Comfortable treatment chairs</li><li><CheckCircle2 /> Closely monitored dialysis stations</li><li><CheckCircle2 /> Welcoming patient-focused environment</li></ul><Link to="/facilities" className="public-primary light">Explore our facilities <ArrowRight size={17} /></Link></div></section>

    <section className="public-cta"><div><p className="public-eyebrow dark">Here when you need us</p><h2>Take the next step with confidence.</h2><p>Connect with our team for treatment inquiries, center information, or help accessing your patient portal.</p></div><div className="public-actions"><Link to="/contact" className="public-primary">Contact our team <ArrowRight size={17} /></Link><Link to="/login" className="public-secondary dark">Open secure portal</Link></div></section>
  </>;
};

export default LandingPage;
