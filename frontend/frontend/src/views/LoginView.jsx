import React, { useState } from "react";
import { loginUser, registerUser } from "../services/authService";

export default function LoginView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isRegister) {
        await registerUser({ name, email, password });
        setSuccessMsg("Account created successfully! Please sign in.");
        setIsRegister(false);
        setPassword("");
      } else {
        const res = await loginUser({ email, password });
        if (res.access_token) {
          localStorage.setItem("token", res.access_token);
          if (res.user) {
            localStorage.setItem("user", JSON.stringify(res.user));
          }
          if (onLoginSuccess) {
            onLoginSuccess(res.user);
          }
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "An error occurred. Please check your inputs and try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (e) => {
    e.preventDefault();
    setIsRegister(!isRegister);
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* BRAND HEADER */}
        <div className="login-brand-header">
          <div className="login-logo-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2>Pomaii</h2>
          <span className="brand-tagline">Explore. Dream. Discover.</span>
        </div>

        <div className="login-title-section">
          <h3>{isRegister ? "Create an Account" : "Welcome Back"}</h3>
          <p>
            {isRegister
              ? "Register to start managing group trip ledgers, splitting expenses, and tracking bookings."
              : "Sign in to access your group trip ledger, track expenses, and manage bookings."}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              borderRadius: "6px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              fontSize: "14px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              borderRadius: "6px",
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              color: "#22c55e",
              fontSize: "14px",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="alex.morgan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>Password</label>
              {!isRegister && (
                <a
                  href="#forgot"
                  className="forgot-link"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot Password?
                </a>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isRegister && (
            <div className="login-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me on this device</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-login-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Sign In to Ledger"}
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <div className="social-login-actions">
          <button
            type="button"
            className="btn btn-social-login"
            onClick={(e) => e.preventDefault()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="login-footer-text">
          <p>
            {isRegister
              ? "Already have an account? "
              : "Don't have an account? "}
            <a href="#toggle" onClick={toggleMode}>
              {isRegister ? "Sign in" : "Create an account"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
