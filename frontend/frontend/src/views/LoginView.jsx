import React, { useEffect, useRef, useState } from "react";
import {
  loginUser,
  loginWithGoogle,
  registerUser,
} from "../services/authService";

export default function LoginView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const googleButtonRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          setError("");
          setSuccessMsg("");
          setLoading(true);
          try {
            const res = await loginWithGoogle(response.credential);
            localStorage.setItem("token", res.access_token);
            if (res.user) {
              localStorage.setItem("user", JSON.stringify(res.user));
            }
            if (onLoginSuccess) onLoginSuccess(res.user);
          } catch (err) {
            const msg =
              err.response?.data?.detail ||
              "Google sign-in failed. Please try again.";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
          } finally {
            setLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 360,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const timer = window.setInterval(() => {
        if (window.google?.accounts?.id) {
          window.clearInterval(timer);
          renderGoogleButton();
        }
      }, 100);
      return () => window.clearInterval(timer);
    }
  }, [onLoginSuccess]);

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
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div
              ref={googleButtonRef}
              style={{
                display: "flex",
                justifyContent: "center",
                minHeight: "44px",
              }}
            />
          ) : (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "6px",
                color: "#b45309",
                background: "rgba(245, 158, 11, 0.12)",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to the
              frontend .env file.
            </div>
          )}
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
