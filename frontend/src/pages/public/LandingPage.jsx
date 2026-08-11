import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, HeartPulse, Megaphone, Microscope, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const LandingPage = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api.get("/announcements/public")
      .then(({ data }) => setAnnouncements(data.data.slice(0, 3)))
      .catch(() => setAnnouncements([]));
  }, []);

  return <>
    <section className="public-hero">
      <div className="public-hero-image" />
      <div className="public-hero-overlay" />
      <div className="public-container public-hero-content">
        <p className="public-eyebrow"><HeartPulse size={16} /> Trusted renal care since 2009</p>
        <h1>Better dialysis care begins with feeling understood.</h1>
        <p className="public-hero-lead">Modern treatment, attentive clinical teams, and a calm environment—working together around every patient.</p>
        <div className="public-actions"><Link to="/services" className="public-primary">Explore our care <ArrowRight size={17} /></Link><Link to="/contact" className="public-secondary">Plan your visit</Link></div>
      </div>
      <div className="public-hero-stats"><div><strong>2009</strong><span>Serving our community since</span></div><div><strong>Patient-first</strong><span>Care built around comfort</span></div><div><strong>Modern</strong><span>Dialysis monitoring systems</span></div></div>
    </section>

    <section className="public-section public-intro"><div className="public-container public-split"><div><p className="public-eyebrow dark">Focused dialysis care</p><h2>Clinical expertise with a genuinely human touch.</h2></div><div><p>Dialysis is more than a treatment schedule. It is part of daily life. Our center brings together reliable technology, carefully coordinated care, and a welcoming team to support patients through every session.</p><Link to="/about" className="public-text-link">Our approach to care <ArrowRight size={16} /></Link></div></div></section>

    {announcements.length > 0 && <section className="public-section bg-slate-50"><div className="public-container"><div className="public-section-heading"><div><p className="public-eyebrow dark"><Megaphone size={15} /> Latest updates</p><h2>Announcements from the center.</h2></div><Link to="/announcements" className="public-text-link">View all announcements <ArrowRight size={16} /></Link></div><div className="grid gap-5 lg:grid-cols-3">{announcements.map((item) => <article key={item._id} className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="flex min-w-0 flex-1 flex-col">{item.media?.[0] && <div className="grid h-44 place-items-center overflow-hidden bg-slate-950"><img src={item.media[0].dataUrl} alt={item.title} loading="lazy" className="h-full w-full object-contain" /></div>}<div className="flex flex-1 flex-col p-4"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${item.priority === "Urgent" ? "bg-red-50 text-red-700" : item.priority === "Important" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{item.priority}</span><time className="flex items-center gap-1 text-[9px] text-slate-400"><CalendarClock size={11} />{new Date(item.createdAt).toLocaleDateString()}</time></div><h3 className="mt-3 text-base font-black text-slate-950">{item.title}</h3><p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-5 text-slate-600">{item.message}</p><Link to="/announcements" className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3 text-[11px] font-bold text-emerald-700">Read announcement <ArrowRight size={12} /></Link></div></div></article>)}</div></div></section>}

    <section className="public-section public-muted"><div className="public-container"><div className="public-section-heading"><div><p className="public-eyebrow dark">Why patients choose us</p><h2>Everything needed for confident care.</h2></div><Link to="/technology" className="public-text-link">See our facilities <ArrowRight size={16} /></Link></div><div className="public-feature-grid">
      <article><span><Stethoscope /></span><h3>Coordinated treatment</h3><p>Experienced professionals maintain continuity and clear communication throughout each patient’s care.</p></article>
      <article><span><Microscope /></span><h3>Modern technology</h3><p>Contemporary dialysis and monitoring systems help teams deliver precise, closely observed treatment.</p></article>
      <article><span><ShieldCheck /></span><h3>Safety and dignity</h3><p>Thoughtful protocols, clean spaces, and respectful support create confidence at every visit.</p></article>
    </div></div></section>

    <section className="public-showcase"><div className="public-showcase-image" /><div className="public-showcase-copy"><p className="public-eyebrow">Designed for comfort</p><h2>A calmer space for every treatment.</h2><p>Bright treatment areas, comfortable stations, and attentive staff make longer sessions feel less clinical and more reassuring.</p><ul><li><CheckCircle2 /> Comfortable treatment chairs</li><li><CheckCircle2 /> Closely monitored dialysis stations</li><li><CheckCircle2 /> Welcoming patient-focused environment</li></ul><Link to="/technology" className="public-primary light">Explore our technology <ArrowRight size={17} /></Link></div></section>

    <section className="public-cta"><div><p className="public-eyebrow dark">Here when you need us</p><h2>Take the next step with confidence.</h2><p>Connect with our team for treatment inquiries, center information, or help accessing your patient portal.</p></div><div className="public-actions"><Link to="/contact" className="public-primary">Contact our team <ArrowRight size={17} /></Link><Link to="/login" className="public-secondary dark">Open secure portal</Link></div></section>
  </>;
};

export default LandingPage;
