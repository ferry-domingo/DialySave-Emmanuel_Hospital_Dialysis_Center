import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, HeartPulse, LockKeyhole } from "lucide-react";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import { useAuthStore } from "../store/authStore";
import { defaultPathForRole } from "../utils/roles";
import toast from "react-hot-toast";
import PublicHeader from "../components/public/PublicHeader";

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
  const [rememberMe, setRememberMe] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState("request");
  const [resetToken, setResetToken] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetForm, setResetForm] = useState({ identifier: "", code: "", newPassword: "", confirmPassword: "" });
  const navigate = useNavigate();
  const { login, loading, error, requestPasswordReset, verifyPasswordResetCode, resetPassword } = useAuthStore();

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
      const result = await login(loginId, password, rememberMe);
      navigate(defaultPathForRole(result.user?.role), { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  const requestReset = async (event) => {
    event.preventDefault();
    if (!resetForm.identifier.trim()) return toast.error("Enter your email or account ID.");
    setResetLoading(true);
    try {
      const result = await requestPasswordReset(resetForm.identifier.trim());
      setResetStep("verify");
      toast.success(result.message);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not send a reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  const verifyResetCode = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(resetForm.code)) return toast.error("Enter the 6-digit reset code.");
    setResetLoading(true);
    try {
      const result = await verifyPasswordResetCode(resetForm.identifier.trim(), resetForm.code);
      setResetToken(result.resetToken);
      setResetStep("password");
      toast.success(result.message);
    } catch (verifyError) {
      toast.error(verifyError.response?.data?.message || "Could not verify the reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  const completeReset = async (event) => {
    event.preventDefault();
    if (resetForm.newPassword.length < 8) return toast.error("New password must be at least 8 characters.");
    if (resetForm.newPassword !== resetForm.confirmPassword) return toast.error("New passwords do not match.");
    if (!resetToken) return toast.error("Verify your reset code first.");
    setResetLoading(true);
    try {
      const result = await resetPassword(resetToken, resetForm.newPassword);
      toast.success(result.message);
      setLoginId(resetForm.identifier.trim());
      setResetOpen(false);
      setResetStep("request");
      setResetToken("");
      setResetForm({ identifier: "", code: "", newPassword: "", confirmPassword: "" });
    } catch (resetError) {
      toast.error(resetError.response?.data?.message || "Could not reset the password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-backdrop" aria-hidden="true" />
      <div className="public-site login-page-public-header">
        <PublicHeader />
      </div>

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

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                <span aria-hidden="true" />
                Remember me
              </label>
              <button type="button" className="forgot-password" onClick={() => { setResetForm((value) => ({ ...value, identifier: value.identifier || loginId })); setResetOpen(true); }}>Forgot Password?</button>
            </div>

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

      <Modal isOpen={resetOpen} onClose={() => { if (!resetLoading) { setResetOpen(false); setResetStep("request"); setResetToken(""); } }} title="Reset your password" maxWidth="max-w-md">
        {resetStep === "request" ? <form onSubmit={requestReset} className="password-reset-form">
          <p>Enter the email, Patient ID, or Doctor ID connected to your account. A reset code will be sent to your verified email.</p>
          <div className="login-field"><label htmlFor="resetIdentifier">Email or account ID</label><input id="resetIdentifier" value={resetForm.identifier} onChange={(event) => setResetForm((value) => ({ ...value, identifier: event.target.value }))} placeholder="Email, PAT- ID, or DOC- ID" autoComplete="username" required /></div>
          <button type="submit" className="login-button" disabled={resetLoading}>{resetLoading ? "Sending code..." : "Send reset code"}</button>
        </form> : resetStep === "verify" ? <form onSubmit={verifyResetCode} className="password-reset-form">
          <p>Enter the six-digit code sent to the account’s verified email.</p>
          <div className="login-field"><label htmlFor="resetCode">6-digit reset code</label><input id="resetCode" inputMode="numeric" value={resetForm.code} onChange={(event) => setResetForm((value) => ({ ...value, code: event.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="000000" required /></div>
          <div className="password-reset-actions"><button type="button" onClick={() => setResetStep("request")} disabled={resetLoading}>Back</button><button type="submit" className="login-button" disabled={resetLoading}>{resetLoading ? "Verifying..." : "Verify code"}</button></div>
        </form> : <form onSubmit={completeReset} className="password-reset-form">
          <p>Your code is verified. Create a new password for your account.</p>
          <div className="login-field"><label htmlFor="resetPassword">New password</label><input id="resetPassword" type="password" value={resetForm.newPassword} onChange={(event) => setResetForm((value) => ({ ...value, newPassword: event.target.value }))} autoComplete="new-password" required /></div>
          <div className="login-field"><label htmlFor="resetConfirmPassword">Confirm new password</label><input id="resetConfirmPassword" type="password" value={resetForm.confirmPassword} onChange={(event) => setResetForm((value) => ({ ...value, confirmPassword: event.target.value }))} autoComplete="new-password" required /></div>
          <div className="password-reset-actions"><button type="button" onClick={() => { setResetStep("verify"); setResetToken(""); }} disabled={resetLoading}>Back</button><button type="submit" className="login-button" disabled={resetLoading}>{resetLoading ? "Resetting..." : "Reset password"}</button></div>
        </form>}
      </Modal>

      {loading && <Loader fullScreen label="Logging in..." />}
    </main>
  );
};

export default LoginPage;
