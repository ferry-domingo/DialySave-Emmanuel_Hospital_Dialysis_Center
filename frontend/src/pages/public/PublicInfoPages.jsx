import { useEffect, useState } from "react";
import { Activity, ArrowRight, BadgeCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Compass, Download, Eye, HeartHandshake, Mail, MapPin, MonitorCheck, Phone, Search, Share2, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import OneClickImageLightbox from "../../components/common/OneClickImageLightbox";

const PageHero = ({ eyebrow, title, text, position = "center", className = "" }) => <section className={`info-hero image-${position} ${className}`}><div className="info-hero-overlay"/><div className="public-container"><p className="public-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div></section>;
const CTA = () => <section className="public-cta"><div><p className="public-eyebrow dark">Patient support</p><h2>Questions about treatment or your visit?</h2></div><Link to="/contact" className="public-primary">Talk to our team <ArrowRight size={17}/></Link></section>;

export const AboutPage = () => <><PageHero eyebrow="About Emmanuel Hospital" title="Rooted in care. Focused on better outcomes." text="Since 2009, our dialysis center has supported patients and families with attentive, dependable renal care." position="right" className="about-hero"/><section className="public-section"><div className="public-container public-split"><div><p className="public-eyebrow dark">Our purpose</p><h2>Care that sees the person, not just the treatment.</h2></div><div><p>We believe excellent dialysis care balances clinical discipline with kindness. Every treatment plan, conversation, and space is shaped to help patients feel informed, respected, and supported.</p><p>Our team works together to create consistent experiences and maintain the continuity that long-term care deserves.</p></div></div><div className="public-container public-values"><article><HeartHandshake/><h3>Compassion</h3><p>We listen closely and care with patience.</p></article><article><ShieldCheck/><h3>Integrity</h3><p>We act responsibly and communicate clearly.</p></article><article><Sparkles/><h3>Excellence</h3><p>We continuously strengthen care and service.</p></article></div></section><section className="public-section public-mission-vision"><div className="public-container"><div className="mission-vision-heading"><p className="public-eyebrow dark">What guides our care</p><h2>Our mission and vision</h2></div><div className="mission-vision-grid"><article><div className="mission-vision-icon"><Compass/></div><p className="public-eyebrow dark">Our commitment</p><h3>Mission</h3><p>To work hand-in-hand with the government in the provision of holistic, affordable, high quality health care for the Filipino people, specifically in the prevention and treatment of end-stage renal disease through patient-centered plan of care, competent health care team and exemplary dialysis treatment.</p></article><article><div className="mission-vision-icon"><Eye/></div><p className="public-eyebrow dark">Our direction</p><h3>Vision</h3><p>To be the leading center for renal diseases in Region III, which provides the highest level of quality patient care, exemplary training, continuous research and development, and high quality dialysis treatment through the latest innovative technology.</p></article></div><div className="accreditation-strip"><div><p className="public-eyebrow dark">Recognized care</p><h2>Accredited healthcare provider</h2></div><div className="accreditation-list"><article><BadgeCheck/><div><strong>PhilHealth</strong><span>Accredited healthcare provider</span></div></article><article><BadgeCheck/><div><strong>Philippine Charity Sweepstakes Office</strong><span>PCSO accredited healthcare provider</span></div></article></div></div></div></section><CTA/></>;

export const ServicesPage = () => <><PageHero eyebrow="Dialysis services" title="Coordinated care for every stage of treatment." text="Patient-focused services designed to make treatment safer, clearer, and easier to navigate."/><section className="public-section public-muted"><div className="public-container"><div className="public-section-heading"><div><p className="public-eyebrow dark">What we provide</p><h2>Support beyond the dialysis station.</h2></div></div><div className="service-list"><article><span>01</span><div><Stethoscope/><h3>Hemodialysis treatment</h3><p>Scheduled center-based treatment with ongoing clinical observation and attentive support.</p></div></article><article><span>02</span><div><Activity/><h3>Treatment monitoring</h3><p>Organized session records and monitoring help the care team maintain continuity across visits.</p></div></article><article><span>03</span><div><HeartHandshake/><h3>Patient coordination</h3><p>Clear guidance helps patients and families understand schedules, documentation, and care needs.</p></div></article></div></div></section><CTA/></>;

const TechnologySlider = ({ category = "technology", fallback = true, label = "Facilities gallery" }) => {
  const [photos, setPhotos] = useState([]);
  const [current, setCurrent] = useState(0);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    api.get("/technology-gallery").then(({ data }) => setPhotos(data.data.filter((photo) => (photo.category || "technology") === category))).catch(() => setPhotos([]));
  }, [category]);

  useEffect(() => {
    if (photos.length < 2) return undefined;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % photos.length), 1000);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  if (!photos.length) return fallback ? <div className="technology-image" role="img" aria-label="Emmanuel Hospital treatment facility" /> : <div className="technology-slider technology-slider-empty"><p>Photos will appear here after they are added by the center.</p></div>;
  const move = (direction) => setCurrent((index) => (index + direction + photos.length) % photos.length);

  return <div className="technology-slider" aria-roledescription="carousel" aria-label={label}>
    {photos.map((photo, index) => <img key={photo._id} src={photo.imageUrl} alt={photo.caption || `Facility photo ${index + 1}`} className={index === current ? "active" : ""} aria-hidden={index !== current} role={index === current ? "button" : undefined} tabIndex={index === current ? 0 : -1} onClick={() => index === current && setPreview({ src: photo.imageUrl, alt: photo.caption || `Facility photo ${index + 1}` })} onKeyDown={(event) => { if (index === current && (event.key === "Enter" || event.key === " ")) setPreview({ src: photo.imageUrl, alt: photo.caption || `Facility photo ${index + 1}` }); }} />)}
    {photos.length > 1 && <><button type="button" className="technology-slider-arrow previous" onClick={() => move(-1)} aria-label="Previous photo"><ChevronLeft /></button><button type="button" className="technology-slider-arrow next" onClick={() => move(1)} aria-label="Next photo"><ChevronRight /></button><div className="technology-slider-dots">{photos.map((photo, index) => <button key={photo._id} type="button" className={index === current ? "active" : ""} onClick={() => setCurrent(index)} aria-label={`Show photo ${index + 1}`} aria-current={index === current ? "true" : undefined} />)}</div></>}
    <OneClickImageLightbox image={preview} onClose={() => setPreview(null)} />
  </div>;
};

export const TechnologyPage = () => <><PageHero eyebrow="Facilities & technology" title="Modern systems. Calm, carefully designed spaces." text="Thoughtful facilities and technology support precision, safety, and the person receiving care." position="left"/><section className="public-section"><div className="public-container technology-grid"><TechnologySlider/><div><p className="public-eyebrow dark">Treatment environment</p><h2>Built for safety, visibility, and comfort.</h2><p>Our dialysis stations bring essential treatment and monitoring tools together in a bright, organized environment.</p><ul><li><MonitorCheck/> Modern treatment monitoring</li><li><ShieldCheck/> Structured clinical workflows</li><li><CheckCircle2/> Comfortable patient stations</li><li><Sparkles/> Clean, thoughtfully maintained spaces</li></ul></div></div></section><CTA/></>;

const GALLERY_ALBUMS = [
  { value: "organization", label: "Organization Activities" },
  { value: "training", label: "Training" },
];

const AlbumGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [album, setAlbum] = useState("organization");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    api.get("/technology-gallery").then(({ data }) => setPhotos(data.data.filter((photo) => photo.category === "organization" || photo.category === "training"))).catch(() => setPhotos([]));
  }, []);

  const albumPhotos = photos.filter((photo) => photo.category === album);
  const visiblePhotos = albumPhotos.filter((photo) => `${photo.name} ${photo.caption || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const albumLabel = GALLERY_ALBUMS.find((item) => item.value === album)?.label || "Gallery";
  const shareAlbum = async () => {
    const shareData = { title: `${albumLabel} | Emmanuel Hospital`, text: `View the ${albumLabel} photo album.`, url: window.location.href };
    if (navigator.share) return navigator.share(shareData).catch(() => undefined);
    await navigator.clipboard.writeText(window.location.href);
  };
  const openPhoto = (photo) => setViewing({ src: photo.imageUrl, alt: photo.caption || photo.name });

  return <>
    <div className="album-controls">
      <h2>Select event album</h2>
      <label>Event album<select value={album} onChange={(event) => { setAlbum(event.target.value); setQuery(""); }}>{GALLERY_ALBUMS.map((item) => <option key={item.value} value={item.value}>{item.label} ({photos.filter((photo) => photo.category === item.value).length} photos)</option>)}</select></label>
      <div className="album-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search in this album..." /></div>
      <div className="album-actions"><button type="button" onClick={shareAlbum}><Share2 size={16}/> Share album</button><a href={albumPhotos[0]?.imageUrl || "#"} download className={!albumPhotos.length ? "disabled" : ""}><Download size={16}/> Download</a></div>
    </div>
    <p className="album-result">Showing <strong>{visiblePhotos.length}</strong> of {albumPhotos.length} photos for <b>{albumLabel}</b></p>
    <div className="album-grid">
      {visiblePhotos.map((photo) => <article key={photo._id}><button type="button" className="album-photo" onClick={() => openPhoto(photo)} aria-label={`View ${photo.caption || photo.name}`}><img src={photo.imageUrl} alt={photo.caption || photo.name}/></button><div><strong>{photo.caption || photo.name}</strong><a href={photo.imageUrl} download={photo.name} title="Download photo" aria-label={`Download ${photo.name}`}><Download size={16}/></a></div></article>)}
      {!visiblePhotos.length && <p className="album-empty">No photos found in this album.</p>}
    </div>
    <OneClickImageLightbox image={viewing} onClose={() => setViewing(null)} />
  </>;
};

export const GalleryPage = () => <><PageHero eyebrow="Center gallery" title="Activities, learning, and shared progress." text="A look at the programs, community activities, and professional training that strengthen our center." position="right"/><section className="public-section public-muted"><div className="public-container"><AlbumGallery/></div></section><CTA/></>;

export const ContactPage = () => <><PageHero eyebrow="Contact & visits" title="We are ready to help you plan your next step." text="Reach the center for treatment inquiries, scheduling guidance, or help accessing the secure portal." position="right"/><section className="public-section"><div className="public-container contact-grid"><div><p className="public-eyebrow dark">Get in touch</p><h2>Talk with our care team.</h2><p>Use the confirmed contact details provided by the center for appointments and patient inquiries.</p><div className="contact-cards"><article><Phone/><div><strong>Call the center</strong><span>For scheduling and treatment questions</span></div></article><article><Mail/><div><strong>Email support</strong><span>For general and portal inquiries</span></div></article><article><MapPin/><div><strong>Visit us</strong><span>Emmanuel Hospital Dialysis Center</span></div></article><article><Clock3/><div><strong>Center hours</strong><span>Contact the center for the current schedule</span></div></article></div></div><aside><h3>Already registered?</h3><p>Access records, messages, alerts, and role-specific tools through the secure portal.</p><Link to="/login" className="public-primary">Sign in to portal <ArrowRight size={17}/></Link><small>Do not share your password or account ID with anyone.</small></aside></div></section></>;
