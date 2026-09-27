import React from "react";

/**
 * Clean, minimalist monochrome (black & white) weather & metric SVG icons.
 * Uses stroke/fill with `currentColor` to adapt seamlessly to light & dark modes.
 */

export function WeatherIcon({ code, isDay = 1, size = 24, className = "" }) {
  // WMO Code mapping:
  // 0: Clear
  // 1, 2: Partly Cloudy
  // 3: Overcast
  // 45, 48: Fog
  // 51-57: Drizzle
  // 61-67, 80-82: Rain
  // 71-77, 85-86: Snow
  // 95-99: Thunderstorm

  const s = size;

  if (code === 0) {
    if (isDay) {
      // Clear Sun
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    }
    // Clear Moon
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  if (code <= 2) {
    // Partly Cloudy (Sun + Cloud)
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
        <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" strokeWidth="1.5" opacity="0.6" />
        <circle cx="12" cy="7" r="3" strokeWidth="1.5" opacity="0.6" />
        <path d="M18 19A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        <path d="M3 16.3A5 5 0 0 0 8 20h10a5 5 0 0 0 0-10" />
      </svg>
    );
  }

  if (code === 3) {
    // Overcast Cloud
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
        <path d="M18 10h-1.26A8 8 0 1 0 3 16.3A5 5 0 0 0 8 20h10a5 5 0 0 0 0-10z" />
      </svg>
    );
  }

  if (code <= 48) {
    // Fog / Mist
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
        <path d="M5 9h14M3 13h18M6 17h12" />
      </svg>
    );
  }

  if (code <= 57) {
    // Drizzle / Light Rain
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
        <path d="M18 9h-1.26A8 8 0 1 0 3 15.3A5 5 0 0 0 8 18h10a5 5 0 0 0 0-9z" />
        <line x1="8" y1="20" x2="8" y2="22" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="16" y1="20" x2="16" y2="22" />
      </svg>
    );
  }

  if (code <= 67 || (code >= 80 && code <= 82)) {
    // Rain
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
        <path d="M16 13v6M8 13v6M12 15v6" />
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
      </svg>
    );
  }

  if (code <= 77 || (code >= 85 && code <= 86)) {
    // Snow
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
        <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
        <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth="2.5" />
        <line x1="12" y1="19" x2="12.01" y2="19" strokeWidth="2.5" />
        <line x1="16" y1="18" x2="16.01" y2="18" strokeWidth="2.5" />
      </svg>
    );
  }

  if (code >= 95) {
    // Thunderstorm
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
        <path d="M19 15A5 5 0 0 0 18 5h-1.26A8 8 0 1 0 3 13" />
        <polyline points="13 11 9 17 14 17 11 23" />
      </svg>
    );
  }

  // Default Cloud
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`weather-svg-icon ${className}`}>
      <path d="M18 10h-1.26A8 8 0 1 0 3 16.3A5 5 0 0 0 8 20h10a5 5 0 0 0 0-10z" />
    </svg>
  );
}

// B&W Metric Icons
export function MetricIcon({ name, size = 18, className = "" }) {
  const s = size;

  switch (name) {
    case "humidity":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      );
    case "wind":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
        </svg>
      );
    case "rain":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M16 13v6M8 13v6M12 15v6" />
          <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        </svg>
      );
    case "cloud":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18 10h-1.26A8 8 0 1 0 3 16.3A5 5 0 0 0 8 20h10a5 5 0 0 0 0-10z" />
        </svg>
      );
    case "pressure":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 12l3-3" />
        </svg>
      );
    case "uv":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
        </svg>
      );
    case "air":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "sun":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M17 18a5 5 0 0 0-10 0" />
          <line x1="12" y1="2" x2="12" y2="9" />
          <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
          <line x1="1" y1="18" x2="23" y2="18" />
        </svg>
      );
    case "drop":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      );
    case "plane":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M17.8 19.2L16 11l3.5-3.5C20.1 6.9 20.1 6 19.5 5.5s-1.4-.6-2 0L14 9l-8.2-1.8c-.5-.1-.9.1-1.1.5l-1 1.7c-.2.4-.1.9.3 1.1L8.5 13l-3.3 3.3-2.1-.6c-.4-.1-.8.1-1 .4l-.6 1c-.2.4-.1.8.2 1.1l3.5 2.5 2.5 3.5c.3.3.7.4 1.1.2l1-.6c.3-.2.5-.6.4-1l-.6-2.1L13 17.5l2.5 4.5c.2.4.7.5 1.1.3l1.7-1c.4-.2.6-.6.5-1.1z" />
        </svg>
      );
    default:
      return null;
  }
}
