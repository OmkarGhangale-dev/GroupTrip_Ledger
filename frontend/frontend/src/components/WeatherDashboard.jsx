import React, { useCallback, useEffect, useState } from "react";
import { useTrip } from "../context/TripContext";
import { getTripWeather } from "../services/twinService";
import { WeatherIcon, MetricIcon } from "./common/WeatherIcon";

const errMsg = (e, fallback) => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => `${(x.loc || []).join(".")}: ${x.msg}`).join("; ");
  return fallback;
};

const LABEL = (c) =>
  c === 0 ? "Clear sky" : c <= 2 ? "Mostly clear" : c === 3 ? "Overcast" : c <= 48 ? "Fog" : c <= 57 ? "Drizzle"
  : c <= 67 ? "Rain" : c <= 77 ? "Snow" : c <= 82 ? "Rain showers" : c <= 86 ? "Snow showers" : c >= 95 ? "Thunderstorm" : "Unsettled";

const DIR = (d) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round((d || 0) / 45) % 8];
const aqiLabel = (v) => v == null ? "–" : v <= 50 ? "Good" : v <= 100 ? "Moderate" : v <= 150 ? "Unhealthy" : "Unhealthy";
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
      <div className="tw-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <span className="tw-section-tag">LIVE WEATHER · {w.place}</span>
          <div className="tw-warn" style={{ marginTop: 2 }}>
            {w.source === "open-meteo" ? "Open-Meteo (live)" : w.source} · updated {at?.toLocaleTimeString()} · auto-refresh 60 s
          </div>
        </div>
        {onSimulate && <button className="tw-btn ghost" onClick={onSimulate}>Run what-if simulation</button>}
      </div>

      {/* Main Temperature Hero */}
      <div className="wd-now">
        <div className="wd-big">
          <WeatherIcon code={c.weather_code} isDay={c.is_day} size={48} />
          <span>{Math.round(c.temperature_2m)}°C</span>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{LABEL(c.weather_code)}</div>
          <div className="tw-warn">Feels like {Math.round(c.apparent_temperature)}°C</div>
        </div>
      </div>

      {/* 8 Metric KPI Grid (4x2 clean layout) */}
      <div className="tw-kpis-grid">
        <div className="tw-kpi">
          <div className="tw-kpi-header">
            <MetricIcon name="humidity" size={16} />
            <small>Humidity</small>
          </div>
          <b>{c.relative_humidity_2m}%</b>
        </div>

        <div className="tw-kpi">
          <div className="tw-kpi-header">
            <MetricIcon name="wind" size={16} />
            <small>Wind</small>
          </div>
          <b>{Math.round(c.wind_speed_10m)} <span style={{ fontSize: 12, fontWeight: 400 }}>km/h {DIR(c.wind_direction_10m)}</span></b>
          <small>gusts {Math.round(c.wind_gusts_10m)} km/h</small>
        </div>

        <div className="tw-kpi">
          <div className="tw-kpi-header">
            <MetricIcon name="rain" size={16} />
            <small>Rain now</small>
          </div>
          <b>{c.precipitation} mm</b>
        </div>

        <div className="tw-kpi">
          <div className="tw-kpi-header">
            <MetricIcon name="cloud" size={16} />
            <small>Cloud cover</small>
          </div>
          <b>{c.cloud_cover}%</b>
        </div>

        <div className="tw-kpi">
          <div className="tw-kpi-header">
            <MetricIcon name="pressure" size={16} />
            <small>Pressure</small>
          </div>
          <b>{Math.round(c.surface_pressure)} <span style={{ fontSize: 12, fontWeight: 400 }}>hPa</span></b>
        </div>

        <div className="tw-kpi">
          <div className="tw-kpi-header">
            <MetricIcon name="uv" size={16} />
            <small>UV today</small>
          </div>
          <b>{w.daily[0]?.uv ?? "–"}</b>
        </div>

        <div className="tw-kpi">
          <div className="tw-kpi-header">
            <MetricIcon name="air" size={16} />
            <small>Air quality</small>
          </div>
          <b>{w.air?.us_aqi ?? "–"}</b>
          <small>{aqiLabel(w.air?.us_aqi)}</small>
        </div>

        <div className="tw-kpi">
          <div className="tw-kpi-header">
            <MetricIcon name="sun" size={16} />
            <small>Sunrise / Sunset</small>
          </div>
          <b>{hhmm(w.daily[0]?.sunrise)} / {hhmm(w.daily[0]?.sunset)}</b>
        </div>
      </div>

      {/* Hourly Forecast */}
      <h3 style={{ marginTop: 20, marginBottom: 10 }}>NEXT 24 HOURS</h3>
      <div className="wd-scroll">
        {w.hourly.map((h) => (
          <div className="wd-hour" key={h.time}>
            <small>{hhmm(h.time)}</small>
            <div className="wd-hour-icon">
              <WeatherIcon code={h.code} isDay={1} size={22} />
            </div>
            <b>{Math.round(h.temp)}°</b>
            <div className="wd-bar" style={{ height: Math.max(6, ((h.temp - minT) / Math.max(1, maxT - minT)) * 24) }} />
            <small className="wd-pop">
              <MetricIcon name="drop" size={10} />
              <span>{h.pop ?? 0}%</span>
            </small>
          </div>
        ))}
      </div>

      {/* 7-Day Forecast */}
      <h3 style={{ marginTop: 20, marginBottom: 10 }}>7-DAY FORECAST</h3>
      <div className="wd-days">
        {w.daily.map((d) => {
          const inTrip = w.trip_start && d.date >= w.trip_start && d.date <= (w.trip_end || w.trip_start);
          return (
            <div className={`wd-day ${inTrip ? "trip" : ""}`} key={d.date}>
              <div className="wd-day-header">
                <small>{dow(d.date)}</small>
                {inTrip && <span className="wd-trip-pill"><MetricIcon name="plane" size={10} /> Trip</span>}
              </div>
              <div className="wd-day-icon">
                <WeatherIcon code={d.code} isDay={1} size={26} />
              </div>
              <div className="wd-day-temps">
                <b>{Math.round(d.tmax)}°</b>
                <small>{Math.round(d.tmin)}°</small>
              </div>
              <small className="wd-pop">
                <MetricIcon name="drop" size={10} /> {d.pop ?? 0}% · {d.rain} mm
              </small>
            </div>
          );
        })}
      </div>
    </div>
  );
}