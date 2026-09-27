import React, { useCallback, useEffect, useState } from "react";
import { useTrip } from "../context/TripContext";
import { getTripWeather } from "../services/twinService";

const errMsg = (e, fallback) => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => `${(x.loc || []).join(".")}: ${x.msg}`).join("; ");
  return fallback;
};

const ICON = (c, day = 1) =>
  c === 0 ? (day ? "☀️" : "🌙") : c <= 2 ? (day ? "🌤️" : "☁️") : c === 3 ? "☁️" : c <= 48 ? "🌫️"
  : c <= 57 ? "🌦️" : c <= 67 ? "🌧️" : c <= 77 ? "❄️" : c <= 82 ? "🌧️" : c <= 86 ? "🌨️" : c >= 95 ? "⛈️" : "🌥️";
const LABEL = (c) =>
  c === 0 ? "Clear sky" : c <= 2 ? "Mostly clear" : c === 3 ? "Overcast" : c <= 48 ? "Fog" : c <= 57 ? "Drizzle"
  : c <= 67 ? "Rain" : c <= 77 ? "Snow" : c <= 82 ? "Rain showers" : c <= 86 ? "Snow showers" : c >= 95 ? "Thunderstorm" : "Unsettled";
const DIR = (d) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round((d || 0) / 45) % 8];
const aqiLabel = (v) => v == null ? "–" : v <= 50 ? "Good" : v <= 100 ? "Moderate" : v <= 150 ? "Unhealthy (sensitive)" : v <= 200 ? "Unhealthy" : "Very unhealthy";
const hhmm = (t) => (t ? t.slice(11, 16) : "–");
const dow = (d) => new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric" });

/** Live weather for the trip's destination. Refreshes every 60 s. */
export default function WeatherDashboard({ tripId: tripIdProp, onSimulate }) {
  const { trip } = useTrip();
  const tripId = tripIdProp || trip?.id;
  const [w, setW] = useState(null);
  const [err, setErr] = useState("");
  const [at, setAt] = useState(null);

  const load = useCallback(async () => {
    if (!tripId) return;
    try { setW(await getTripWeather(tripId)); setErr(""); setAt(new Date()); }
    catch (e) { setErr(errMsg(e, "Could not load weather.")); }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load, tripId]);

  if (!tripId) return <div className="tw-card">Select a trip to see its weather.</div>;
  if (err) return <div className="tw-card" style={{ color: "#dc2626" }}>{err}</div>;
  if (!w) return <div className="tw-card">Loading live weather…</div>;
  const c = w.current;
  const maxT = Math.max(...w.hourly.map((h) => h.temp)), minT = Math.min(...w.hourly.map((h) => h.temp));

  return (
    <div className="tw-card wd">
      <div className="tw-row" style={{ justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0 }}>Live weather · {w.place}</h3>
          <div className="tw-warn">Open-Meteo · updated {at?.toLocaleTimeString()} · auto-refresh 60 s</div>
        </div>
        {onSimulate && <button className="tw-btn ghost" onClick={onSimulate}>Run what-if simulation</button>}
      </div>

      <div className="wd-now">
        <div className="wd-big">{ICON(c.weather_code, c.is_day)} {Math.round(c.temperature_2m)}°C</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{LABEL(c.weather_code)}</div>
          <div className="tw-warn">Feels like {Math.round(c.apparent_temperature)}°C</div>
        </div>
      </div>

      <div className="tw-kpis">
        <div className="tw-kpi"><small>Humidity</small><b>{c.relative_humidity_2m}%</b></div>
        <div className="tw-kpi"><small>Wind</small><b>{Math.round(c.wind_speed_10m)} km/h {DIR(c.wind_direction_10m)}</b><small>gusts {Math.round(c.wind_gusts_10m)}</small></div>
        <div className="tw-kpi"><small>Rain now</small><b>{c.precipitation} mm</b></div>
        <div className="tw-kpi"><small>Cloud cover</small><b>{c.cloud_cover}%</b></div>
        <div className="tw-kpi"><small>Pressure</small><b>{Math.round(c.surface_pressure)} hPa</b></div>
        <div className="tw-kpi"><small>UV today</small><b>{w.daily[0]?.uv ?? "–"}</b></div>
        <div className="tw-kpi"><small>Air quality</small><b>{w.air?.us_aqi ?? "–"}</b><small>{aqiLabel(w.air?.us_aqi)}</small></div>
        <div className="tw-kpi"><small>Sun</small><b>{hhmm(w.daily[0]?.sunrise)} / {hhmm(w.daily[0]?.sunset)}</b></div>
      </div>

      <h3 style={{ marginTop: 16 }}>Next 24 hours</h3>
      <div className="wd-scroll">
        {w.hourly.map((h) => (
          <div className="wd-hour" key={h.time}>
            <small>{hhmm(h.time)}</small>
            <div style={{ fontSize: 20 }}>{ICON(h.code, 1)}</div>
            <b>{Math.round(h.temp)}°</b>
            <div className="wd-bar" style={{ height: 6 + ((h.temp - minT) / Math.max(1, maxT - minT)) * 24 }} />
            <small>💧{h.pop ?? 0}%</small>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 16 }}>7-day forecast</h3>
      <div className="wd-days">
        {w.daily.map((d) => {
          const inTrip = w.trip_start && d.date >= w.trip_start && d.date <= (w.trip_end || w.trip_start);
          return (
            <div className={`wd-day ${inTrip ? "trip" : ""}`} key={d.date}>
              <small>{dow(d.date)}{inTrip ? " ✈" : ""}</small>
              <div style={{ fontSize: 24 }}>{ICON(d.code, 1)}</div>
              <b>{Math.round(d.tmax)}°</b> <small>{Math.round(d.tmin)}°</small>
              <small>💧 {d.pop ?? 0}% · {d.rain} mm</small>
            </div>
          );
        })}
      </div>
      <div className="tw-warn" style={{ marginTop: 6 }}>✈ = your trip days</div>
    </div>
  );
}