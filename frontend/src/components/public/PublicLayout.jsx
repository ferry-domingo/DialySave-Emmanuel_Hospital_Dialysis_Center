import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowRight, Clock3, Mail, MapPin, Menu, Phone, X } from "lucide-react";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Technology", "/technology"],
  ["Contact", "/contact"],
];

const PublicLayout = () => {
  const [open, setOpen] = useState(false);
  const navClass = ({ isActive }) => `public-nav-link ${isActive ? "active" : ""}`;

  return (
    <div className="public-site">
      <header className="public-header">
        <Link to="/" className="public-logo" onClick={() => setOpen(false)}>
          <img src="/images/logo.png" alt="Emmanuel Hospital Dialysis Center" />
          <span><strong>Emmanuel Hospital</strong><small>Dialysis Center</small></span>
        </Link>
        <nav className={open ? "public-nav open" : "public-nav"} aria-label="Main navigation">
          {links.map(([label, path]) => <NavLink key={path} to={path} end={path === "/"} className={navClass} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <Link to="/login" className="public-login" onClick={() => setOpen(false)}>Patient & staff portal <ArrowRight size={15} /></Link>
        </nav>
        <button className="public-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
      </header>

      <main><Outlet /></main>

      <footer className="public-footer">
        <div className="public-footer-grid">
          <div className="public-footer-brand"><img src="/images/logo.png" alt="" /><div><strong>Emmanuel Hospital</strong><span>Dialysis Center</span></div><p>Dependable dialysis care delivered with precision, dignity, and compassion.</p></div>
          <div><h3>Explore</h3>{links.slice(1).map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</div>
          <div><h3>Visit us</h3><p><MapPin size={15} /> Emmanuel Hospital Dialysis Center</p><p><Clock3 size={15} /> Contact the center for current operating hours</p></div>
          <div><h3>Get in touch</h3><p><Phone size={15} /> Contact the dialysis center</p><p><Mail size={15} /> Patient support and inquiries</p><Link className="footer-contact" to="/contact">Contact information <ArrowRight size={14} /></Link></div>
        </div>
        <div className="public-footer-bottom"><span>© {new Date().getFullYear()} Emmanuel Hospital Dialysis Center</span><span>Established 2009</span></div>
      </footer>
    </div>
  );
};

export default PublicLayout;
