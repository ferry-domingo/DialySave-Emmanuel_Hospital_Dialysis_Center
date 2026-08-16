import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowRight, Clock3, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import useSiteContact from "../../hooks/useSiteContact";

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
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const contact = useSiteContact();
  const navClass = ({ isActive }) => `public-nav-link ${isActive ? "active" : ""}`;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="public-site">
      <header className="public-header">
        <Link to="/" className="public-logo" onClick={() => setOpen(false)}>
          <img src="/images/logo.png" alt="Emmanuel Hospital Dialysis Center" />
          <span><strong>Emmanuel Hospital</strong><small>Dialysis Center</small></span>
        </Link>
        <nav id="public-navigation" className={open ? "public-nav open" : "public-nav"} aria-label="Main navigation">
          {links.map(([label, path]) => <NavLink key={path} to={path} end={path === "/"} className={navClass} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <Link to="/login" className="public-login" onClick={() => setOpen(false)}>Patient & staff portal <ArrowRight size={15} /></Link>
        </nav>
        <button className="public-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="public-navigation">{open ? <X /> : <Menu />}</button>
      </header>

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
