import { Link, Outlet } from "react-router-dom";
import { ArrowRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import useSiteContact from "../../hooks/useSiteContact";
import PublicHeader from "./PublicHeader";

const MAP_URL = "https://maps.app.goo.gl/ymqWeC3khXT3vr4r7";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Facilities & Technology", "/facilities"],
  ["Gallery", "/gallery"],
  ["Announcements", "/announcements"],
  ["Contact", "/contact"],
];

const PublicLayout = () => {
  const contact = useSiteContact();

  return (
    <div className="public-site">
      <PublicHeader />

      <main><Outlet /></main>

      <footer className="public-footer">
        <div className="public-footer-grid">
          <div className="public-footer-brand"><img src="/images/logo.png" alt="" /><div><strong>Emmanuel Hospital</strong><span>Dialysis Center</span></div><p>Dependable dialysis care delivered with precision, dignity, and compassion.</p></div>
          <div><h3>Explore</h3>{links.slice(1).map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</div>
          <div><h3>Visit us</h3><a className="footer-location" href={MAP_URL} target="_blank" rel="noreferrer"><MapPin size={15} /> Emmanuel Hospital Dialysis Center</a><p><Clock3 size={15} /> Contact the center for current operating hours</p></div>
          <div><h3>Get in touch</h3>{contact.phone ? <a className="footer-detail-link" href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}><Phone size={15} /> {contact.phone}</a> : <p><Phone size={15} /> Contact the dialysis center</p>}{contact.email ? <a className="footer-detail-link" href={`mailto:${contact.email}`}><Mail size={15} /> {contact.email}</a> : <p><Mail size={15} /> Patient support and inquiries</p>}<Link className="footer-contact" to="/contact">Contact information <ArrowRight size={14} /></Link></div>
        </div>
        <div className="public-footer-bottom"><span>© {new Date().getFullYear()} Emmanuel Hospital Dialysis Center</span><span>Established 2009</span></div>
      </footer>
    </div>
  );
};

export default PublicLayout;
