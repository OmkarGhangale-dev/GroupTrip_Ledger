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
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 relative overflow-hidden">
      {/* Mountain Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-55 dark:opacity-60 pointer-events-none scale-105"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80'), url('/mountain-bg.svg')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/30 via-transparent to-zinc-50/20 dark:from-zinc-950/40 dark:to-zinc-950/30 pointer-events-none"></div>

      {/* Decorative Glows */}
      <div className="absolute top-1/4 -left-20 w-[420px] h-[340px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-[420px] h-[340px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-black/10 dark:border-white/10 text-black dark:text-white">
        {/* BRAND HEADER */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-primary shadow-[0_0_24px_rgba(255,154,77,0.28)] mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">landscape</span>
          </div>
          <span className="font-instrument text-4xl tracking-tight text-on-surface block mb-1">
            FareShare<sup>®</sup>
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold block">
            EXPEDITION LEDGER
          </span>
        </div>

        <div className="text-center mb-6">
          <h3 className="font-instrument text-3xl text-on-surface font-normal mb-1">
            {isRegister ? "Create an Account" : "Welcome Back"}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            {isRegister
              ? "Register to start managing group trip ledgers, splitting expenses, and tracking bookings."
              : "Sign in to access your group trip ledger, track expenses, and manage bookings."}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
              />
            </div>
          )}

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="alex.morgan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Password
              </label>
              {!isRegister && (
                <a
                  href="#forgot"
                  className="font-label-sm text-label-sm text-primary hover:underline"
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
              className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
            />
          </div>

          {!isRegister && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-primary focus:ring-0 bg-surface-container border-white/10"
              />
              <label htmlFor="rememberMe" className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer">
                Remember me on this device
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_24px_rgba(255,154,77,0.35)] transition-all cursor-pointer disabled:opacity-50 mt-2"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Sign In to Ledger"}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="shrink mx-4 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant/60 font-bold">
            OR
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <div className="flex justify-center mb-4">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div
              ref={googleButtonRef}
              className="flex justify-center w-full min-h-[44px]"
            />
          ) : (
            <div className="p-3 rounded-xl bg-primary-container/10 border border-primary/20 text-primary text-xs text-center w-full font-medium">
              Google Sign-In is available when VITE_GOOGLE_CLIENT_ID is set.
            </div>
          )}
        </div>

        <div className="text-center font-body-sm text-body-sm text-on-surface-variant">
          <p>
            {isRegister
              ? "Already have an account? "
              : "Don't have an account? "}
            <a
              href="#toggle"
              onClick={toggleMode}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
