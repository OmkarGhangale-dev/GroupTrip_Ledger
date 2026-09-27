import React from "react";

export default function ChatbotLogo({ className = "", size = 24, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`chatbot-logo-svg ${className}`}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      <defs>
        {/* Main Badge Gradient */}
        <linearGradient id="botBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1b4332" />
          <stop offset="50%" stopColor="#2d6a4f" />
          <stop offset="100%" stopColor="#52b788" />
        </linearGradient>

        {/* Glow & Sparkle Gradient */}
        <linearGradient id="aiSparkleGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#d8f3dc" />
          <stop offset="100%" stopColor="#74c69d" />
        </linearGradient>

        {/* Gold Accent Gradient */}
        <linearGradient id="goldAccent" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#f77f00" />
        </linearGradient>

        {/* Drop Shadow Filter */}
        <filter id="botGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1b4332" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Glow Circle / Rounded Squircle Background */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="14"
        fill="url(#botBgGrad)"
        filter="url(#botGlow)"
      />

      {/* Orbit Ring Accent */}
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="url(#aiSparkleGrad)"
        strokeWidth="1.2"
        strokeDasharray="4 3"
        opacity="0.5"
      />

      {/* AI Bot Head Contour / Compass Paper Airplane Icon */}
      <path
        d="M24 10L36 34L24 28L12 34L24 10Z"
        fill="url(#aiSparkleGrad)"
        opacity="0.9"
      />

      {/* Inner Compass Center / Core */}
      <path
        d="M24 10L24 28L36 34L24 10Z"
        fill="#ffffff"
        opacity="0.3"
      />

      {/* Sparkle Star 1 (Top Right AI Glow) */}
      <path
        d="M35 12C35 14.2 36.8 16 39 16C36.8 16 35 17.8 35 20C35 17.8 33.2 16 31 16C33.2 16 35 14.2 35 12Z"
        fill="url(#goldAccent)"
      />

      {/* Sparkle Star 2 (Bottom Left AI Glow) */}
      <path
        d="M13 28C13 29.5 14.2 30.7 15.7 30.7C14.2 30.7 13 31.9 13 33.4C13 31.9 11.8 30.7 10.3 30.7C11.8 30.7 13 29.5 13 28Z"
        fill="url(#aiSparkleGrad)"
      />
    </svg>
  );
}
