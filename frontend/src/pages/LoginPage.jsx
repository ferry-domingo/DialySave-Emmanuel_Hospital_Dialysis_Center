import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import { useAuthStore } from "../store/authStore";
import { defaultPathForRole } from "../utils/roles";

const LoginPage = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();

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

      <section className="login-card" aria-label="Account login">
        <div className="login-form-panel">
          <h1>Login</h1>
          <h1>gerald</h1>

          <h2>raff</h2>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="loginId">E-mail, Patient ID, or Doctor ID:</label>
              <input
                id="loginId"
                type="text"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                placeholder=""
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder=""
                autoComplete="current-password"
                required
              />
            </div>

            <button type="button" className="forgot-password">
              Forgot Password?
            </button>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Signing in..." : "Log in"}
            </button>
          </form>
        </div>

        <div className="login-brand-panel">
          <img
            src="/images/logo.png"
            alt="Emmanuel Hospital Dialysis Center logo"
          />
          <div>
            <h2>Emmanuel Hospital</h2>
            <p>Dialysis Center</p>
            <span>2009</span>
          </div>
        </div>
      </section>

      {loading && <Loader fullScreen label="Logging in..." />}
    </main>
  );
};

export default LoginPage;
