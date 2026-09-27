import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTrip } from "../context/TripContext";
import { getTwinState, runTwinScenario, sendTwinFeedback } from "../services/twinService";
import WeatherTwinMap from "../components/WeatherTwinMap";
import WeatherDashboard from "../components/WeatherDashboard";
import "./twin.css";

const errMsg = (e, fallback) => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => `${(x.loc || []).join(".")}: ${x.msg}`).join("; ");
  return fallback;
};
const PRESETS = {
  normal:  { label: "Normal (live forecast)", p: null },
  rain:    { label: "Heavy rain",  p: { rain_mm_h: 15, wind_kmh: 45, temp_c: null, duration_h: 6 } },
  cyclone: { label: "Cyclone",     p: { rain_mm_h: 35, wind_kmh: 120, temp_c: null, duration_h: 14 } },
  heat:    { label: "Heatwave",    p: { rain_mm_h: 0, wind_kmh: 20, temp_c: 44, duration_h: 0 } },
};
const pct = (x) => `${Math.round((x || 0) * 100)}%`;
const money = (n, cur) => `${cur || ""} ${Math.round(n || 0).toLocaleString()}`;

export default function TwinView() {
  const { trip, showToast } = useTrip();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [preset, setPreset] = useState("normal");
  const [sc, setSc] = useState({ rain_mm_h: 5, wind_kmh: 30, temp_c: 32, duration_h: 4 });
  const [useSc, setUseSc] = useState({ rain_mm_h: false, wind_kmh: false, temp_c: false, duration_h: false });
  const [loc, setLoc] = useState(null);
  const [auto, setAuto] = useState(true);
  const [showSim, setShowSim] = useState(false);
  const tripId = trip?.id;
  const busy = useRef(false);

  const scenario = useMemo(() => {
    const out = {};
    Object.keys(sc).forEach((k) => { if (useSc[k]) out[k] = Number(sc[k]); });
    if (loc) { out.lat = loc.lat; out.lng = loc.lng; }
    return out;
  }, [sc, useSc, loc]);
  const hasScenario = Object.keys(scenario).length > 0;

  const load = useCallback(async (silent) => {
    if (!tripId || busy.current) return;
    busy.current = true;
    if (!silent) setLoading(true);
    try {
      const d = hasScenario ? await runTwinScenario(tripId, scenario) : await getTwinState(tripId);
      setData(d); setErr("");
    } catch (e) {
      setErr(errMsg(e, "Could not load the weather twin."));
    } finally { busy.current = false; setLoading(false); }
  }, [tripId, scenario, hasScenario]);

  useEffect(() => { load(false); }, [tripId, scenario]); // eslint-disable-line
  useEffect(() => {          // continuous updating: re-pull live data every 60 s
    if (!auto) return;
    const t = setInterval(() => load(true), 60000);
    return () => clearInterval(t);
  }, [auto, load]);

  const applyPreset = (k) => {
    setPreset(k);
    const p = PRESETS[k].p;
    if (!p) { setUseSc({ rain_mm_h: false, wind_kmh: false, temp_c: false, duration_h: false }); setLoc(null); return; }
    setSc((s) => ({ ...s, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v != null)) }));
    setUseSc({ rain_mm_h: p.rain_mm_h != null, wind_kmh: p.wind_kmh != null, temp_c: p.temp_c != null, duration_h: p.duration_h != null });
  };
  const slide = (k, v) => { setSc({ ...sc, [k]: v }); setUseSc({ ...useSc, [k]: true }); setPreset("custom"); };

  if (!tripId) return <div className="twin"><h2>Weather Digital Twin</h2><p>Select a trip first.</p></div>;
  const shown = data?.scenario || data?.baseline;
  const base = data?.baseline;
  const cur = data?.trip?.currency;
  const delta = data?.delta;
  const fin = shown?.finance;
  const arrow = (v, good) => (v > 0 ? <span className="tw-up">▲ {good(v)}</span> : v < 0 ? <span className="tw-down">▼ {good(-v)}</span> : null);

  return (
    <div className="twin">
      <div className="tw-row" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>Weather Digital Twin</h2>
          <div className="tw-sub">
            {data?.trip?.destination} · live weather: {data?.weather?.source}
            {data?.weather?.outside_horizon ? " (trip beyond 16-day horizon, nearest days used)" : ""}
            {data?.weather?.as_of ? ` · updated ${new Date(data.weather.as_of).toLocaleTimeString()}` : ""}
          </div>
        </div>
        <div className="tw-row">
          {shown && <span className={`tw-badge tw-${shown.risk_level}`}>{shown.risk_level.toUpperCase()} RISK</span>}
          <label className="tw-warn"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> live refresh</label>
          <button className="tw-btn ghost" onClick={() => load(false)}>{loading ? "…" : "Refresh"}</button>
        </div>
      </div>
      {err && <div className="tw-card" style={{ color: "#dc2626" }}>{err}</div>}
      <WeatherDashboard tripId={tripId} onSimulate={() => setShowSim((s) => !s)} />

      {showSim && (
        <div className="tw-card">
          <h3>What-if simulator (sandbox – never changes real data)</h3>
          <div className="tw-row" style={{ marginBottom: 8 }}>
            {Object.entries(PRESETS).map(([k, v]) => (
              <button key={k} className={`tw-chip ${preset === k ? "on" : ""}`} onClick={() => applyPreset(k)}>{v.label}</button>
            ))}
            {loc && <button className="tw-chip on" onClick={() => setLoc(null)}>Event moved to {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)} ✕</button>}
          </div>
          {[["rain_mm_h", "Rain intensity", 0, 60, "mm/h"], ["wind_kmh", "Wind gusts", 0, 200, "km/h"],
            ["temp_c", "Temperature", -5, 50, "°C"], ["duration_h", "Duration/day", 0, 24, "h"]].map(([k, label, min, max, u]) => (
            <div className="tw-slider" key={k}>
              <label><input type="checkbox" checked={useSc[k]} onChange={(e) => setUseSc({ ...useSc, [k]: e.target.checked })} /> {label}</label>
              <input type="range" min={min} max={max} value={sc[k]} onChange={(e) => slide(k, e.target.value)} />
              <span>{sc[k]} {u}</span>
            </div>
          ))}
          <div className="tw-warn">Tip: click the map to move the event to another location.</div>
        </div>
      )}

      {shown && (
        <div className="tw-kpis">
          <div className="tw-kpi"><small>Expected extra cost (80% range)</small><b>{money(fin.expected_extra_cost, cur)}</b>
            <small>{money(fin.cost_p10, cur)} – {money(fin.cost_p90, cur)} {delta && arrow(delta.extra_cost, (v) => money(v, cur))}</small></div>
          <div className="tw-kpi"><small>Per person</small><b>{money(fin.per_person_extra, cur)}</b></div>
          <div className="tw-kpi"><small>Budget used (projected)</small><b>{fin.budget_used_pct ?? "–"}{fin.budget_used_pct != null ? "%" : ""}</b>
            <small>P(over budget) {pct(fin.prob_over_budget)}</small></div>
          <div className="tw-kpi"><small>Expected cancellations</small><b>{shown.itinerary.expected_cancellations}</b>
            <small>{shown.itinerary.expected_disrupted_days} disrupted days {delta && arrow(delta.cancellations, (v) => v.toFixed(1))}</small></div>
        </div>
      )}

      <div className="tw-grid">
        <div className="tw-card">
          <h3>Impact map – disruption probability & cascades</h3>
          <WeatherTwinMap data={shown} center={data?.trip?.center} moved={data?.weather?.location_moved}
            hazard={shown?.peak_hazard} onPick={(lat, lng) => { setLoc({ lat, lng }); setPreset("custom"); }} />
          <div className="tw-warn">Circle size/colour = P(disruption). Purple dashed lines = cascading effects (a failed transport knocks over later plans).</div>
        </div>
        <div className="tw-card">
          <h3>Social & news signals</h3>
          {data?.social && (
            <>
              <div className="tw-row" style={{ marginBottom: 6 }}>
                <span className="tw-badge" style={{ background: "#2563eb" }}>signal {pct(data.social.social_boost)}</span>
                <span className="tw-warn">{data.social.agreement}{data.social.live ? "" : " · sample data (feeds offline)"}</span>
              </div>
              {data.social.top.map((p, i) => (
                <div className="tw-post" key={i}>
                  {(() => {
  const t = p.text.replace(/https?:\/\/\S+/g, "").trim() || p.text;
  return p.url ? <a href={p.url} target="_blank" rel="noreferrer">{t}</a> : t;
})()}
                  <br /><small>{p.source} · severity {pct(p.score)}</small>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="tw-grid">
        <div className="tw-card">
          <h3>Daily hazard (bar = mean, whisker range = 10–90%)</h3>
          <div className="tw-days">
            {shown?.days.map((d) => (
              <div className="tw-day" key={d.date} title={`${d.rain_peak} mm/h · gust ${d.gust_max} · ${d.temp_max}°C`}>
                <div style={{ height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div className="tw-bar" style={{ width: "70%", height: `${Math.max(4, d.hazard * 80)}px`,
                    background: d.hazard >= .75 ? "#dc2626" : d.hazard >= .5 ? "#f97316" : d.hazard >= .25 ? "#eab308" : "#22c55e" }} />
                </div>
                {pct(d.hazard)}<br /><small>{d.date.slice(5)}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="tw-card">
          <h3>Most at-risk plans</h3>
          <div className="tw-list">
            {[...(shown?.items || [])].sort((a, b) => b.p_disruption - a.p_disruption).slice(0, 8).map((i) => (
              <div className="tw-item" key={i.id}>
                <span>{i.title}<br /><small>{i.type} · {i.date}</small></span>
                <span>{pct(i.p_disruption)}<br /><small>{pct(i.p10)}–{pct(i.p90)}</small></span>
              </div>
            ))}
            {!shown?.items?.length && <div className="tw-warn">Add itinerary items to see item-level risk.</div>}
          </div>
        </div>
      </div>

      <div className="tw-card">
        <h3>Teach the twin</h3>
        <div className="tw-row">
          <span className="tw-warn">How disruptive was the weather really? (calibrates future predictions)</span>
          {[["None", 0], ["Mild", 0.25], ["Bad", 0.6], ["Severe", 0.9]].map(([l, v]) => (
            <button key={l} className="tw-chip" onClick={async () => {
              try { await sendTwinFeedback(tripId, v); showToast && showToast("Twin recalibrated", "success"); load(true); }
              catch (e) { showToast && showToast("Feedback failed", "error"); setErr(errMsg(e, "Feedback failed.")); }
            }}>{l}</button>
          ))}
          {base && <span className="tw-warn">calibration bias {data.model.bias.toFixed(2)} · {data.model.feedback_n} feedbacks</span>}
        </div>
        <div className="tw-warn" style={{ marginTop: 8 }}>{data?.note}</div>
      </div>
    </div>
  );
}