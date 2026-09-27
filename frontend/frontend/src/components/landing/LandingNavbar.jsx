import React from "react";

export default function LandingNavbar({ onOpenLogin, onOpenRegister, isDark, toggleTheme }) {
  return (
    <header className="notosan-top-nav flex items-center justify-between px-8 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface-container-lowest/40 border-b border-white/5">
      <div className="notosan-brand-logo cursor-pointer font-bold text-xl text-on-surface flex items-center gap-2" onClick={onOpenLogin}>
        <span className="material-symbols-outlined text-primary text-2xl">landscape</span>
        <span>Notosan</span>
      </div>

      <div className="notosan-nav-right flex items-center gap-3">

        <button className="btn-outlined-notosan cursor-pointer" onClick={onOpenLogin}>
          Sign In
        </button>
      </div>
    </header>
  );
}

