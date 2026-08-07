import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, HeartPulse, LockKeyhole, Menu, X } from "lucide-react";
import Loader from "../components/common/Loader";
import { useAuthStore } from "../store/authStore";
import { defaultPathForRole } from "../utils/roles";

const highlights = [
  {
    eyebrow: "Modern facilities",
    title: "Care designed around comfort",
    description: "Bright, carefully planned treatment spaces help every visit feel calmer and more comfortable.",
  },
  {
    eyebrow: "Advanced technology",
    title: "Precision in every session",
    description: "Modern dialysis systems support close monitoring and dependable treatment from start to finish.",
  },
  {
    eyebrow: "Compassionate care",
    title: "People at the heart of care",
    description: "Our clinical team pairs trusted expertise with attentive, personal support for every patient.",
  },
];

const LoginPage = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % highlights.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const changeSlide = (direction) => {
    setActiveSlide((current) => (current + direction + highlights.length) % highlights.length);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const result = await login(loginId, password);
      navigate(defaultPathForRole(result.user?.role), { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="login-page">
      <div className="login-backdrop" aria-hidden="true" />
      <header className="login-public-header">
        <Link to="/" className="login-public-logo">
          <img src="/images/logo.png" alt="Emmanuel Hospital Dialysis Center" />
          <span><strong>Emmanuel Hospital</strong><small>Dialysis Center</small></span>
        </Link>
        <nav className={navOpen ? "login-public-nav open" : "login-public-nav"} aria-label="Public website navigation">
          <Link to="/" onClick={() => setNavOpen(false)}>Home</Link>
          <Link to="/about" onClick={() => setNavOpen(false)}>About</Link>
          <Link to="/services" onClick={() => setNavOpen(false)}>Services</Link>
          <Link to="/technology" onClick={() => setNavOpen(false)}>Technology</Link>
          <Link to="/contact" onClick={() => setNavOpen(false)}>Contact</Link>
          <span>Secure portal</span>
        </nav>
        <button type="button" className="login-public-menu" onClick={() => setNavOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={navOpen}>{navOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="login-card" aria-label="Emmanuel Hospital patient portal">
        <div className="login-form-panel">
          <div className="login-mobile-brand">
            <img src="/images/logo.png" alt="" />
            <span>Emmanuel Hospital Dialysis Center</span>
          </div>
          <div className="login-heading">
            <span className="login-kicker"><HeartPulse size={15} /> Secure patient portal</span>
            <h1>Welcome back</h1>
            <p>Sign in to manage dialysis care and patient records.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="loginId">Email or account ID</label>
              <input
                id="loginId"
                type="text"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                placeholder="Enter email, Patient ID, or Doctor ID"
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="button" className="forgot-password">
              Forgot Password?
            </button>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Signing in..." : "Sign in securely"}
            </button>
          </form>
          <p className="login-security"><LockKeyhole size={14} /> Your connection and health information are protected.</p>
        </div>

        <div className="login-brand-panel" aria-roledescription="carousel" aria-label="Hospital facilities and care">
          <img className={`login-carousel-image slide-${activeSlide}`} src="/images/hospital-care-carousel.jpg" alt="" />
          <div className="login-carousel-shade" />
          <div className="login-brand-lockup">
            <img src="/images/logo.png" alt="Emmanuel Hospital Dialysis Center logo" />
            <div><strong>Emmanuel Hospital</strong><span>Dialysis Center</span></div>
          </div>
          <div className="login-slide-copy" aria-live="polite">
            <p>{highlights[activeSlide].eyebrow}</p>
            <h2>{highlights[activeSlide].title}</h2>
            <span>{highlights[activeSlide].description}</span>
          </div>
          <div className="login-carousel-controls">
            <div className="login-carousel-dots">
              {highlights.map((highlight, index) => (
                <button key={highlight.title} type="button" onClick={() => setActiveSlide(index)} className={index === activeSlide ? "active" : ""} aria-label={`Show slide ${index + 1}: ${highlight.eyebrow}`} aria-current={index === activeSlide ? "true" : undefined} />
              ))}
            </div>
            <div className="login-carousel-arrows">
              <button type="button" onClick={() => changeSlide(-1)} aria-label="Previous slide"><ArrowLeft size={18} /></button>
              <button type="button" onClick={() => changeSlide(1)} aria-label="Next slide"><ArrowRight size={18} /></button>
            </div>
          </div>
        </div>
      </section>

      {loading && <Loader fullScreen label="Logging in..." />}
    </main>
  );
};

export default LoginPage;
