import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Facilities & Technology", "/facilities"],
  ["Gallery", "/gallery"],
  ["Announcements", "/announcements"],
  ["Contact", "/contact"],
];

const PublicHeader = ({ className = "" }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className={`public-header ${className}`.trim()}>
      <Link to="/" className="public-logo" onClick={() => setOpen(false)}>
        <img src="/images/logo.png" alt="Emmanuel Hospital Dialysis Center" />
        <span><strong>Emmanuel Hospital</strong><small>Dialysis Center</small></span>
      </Link>
      <nav id="public-navigation" className={open ? "public-nav open" : "public-nav"} aria-label="Main navigation">
        {links.map(([label, path]) => <NavLink key={path} to={path} end={path === "/"} className={({ isActive }) => `public-nav-link ${isActive ? "active" : ""}`} onClick={() => setOpen(false)}>{label}</NavLink>)}
        <Link to="/login" className="public-login" onClick={() => setOpen(false)}>Patient &amp; staff portal <ArrowRight size={15} /></Link>
      </nav>
      <button className="public-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="public-navigation">{open ? <X /> : <Menu />}</button>
    </header>
  );
};

export default PublicHeader;
