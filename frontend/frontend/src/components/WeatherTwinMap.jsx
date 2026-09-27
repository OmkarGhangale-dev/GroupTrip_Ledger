import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const color = (p) => (p >= 0.75 ? "#dc2626" : p >= 0.5 ? "#f97316" : p >= 0.25 ? "#eab308" : "#22c55e");

function Fit({ points }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);   // fixes half-loaded tiles
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    const pts = points.filter((p) => p.lat != null && p.lng != null).map((p) => [p.lat, p.lng]);
    if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
    else if (pts.length === 1) map.setView(pts[0], 11);
  }, [points.length, points[0]?.lat, points[0]?.lng]); // eslint-disable-line
  return null;
}

function Picker({ onPick }) {
  useMapEvents({ click: (e) => onPick && onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Items coloured by disruption probability, storm radius, cascade edges. */
export default function WeatherTwinMap({ data, center, moved, hazard, onPick }) {
  const items = (data?.items || []).filter((i) => i.lat != null && i.lng != null);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const c = center?.lat != null ? [center.lat, center.lng] : [20.5, 78.9];
  return (
    <MapContainer center={c} zoom={10} style={{ height: 380, width: "100%", borderRadius: 12 }}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Fit points={[...items, ...(center?.lat != null ? [center] : [])]} />
      <Picker onPick={onPick} />
      {center?.lat != null && (
        <Circle center={c} radius={2500 + 6000 * (hazard || 0)}
          pathOptions={{ color: color(hazard || 0), fillOpacity: 0.12, dashArray: moved ? "6 6" : undefined }} />
      )}
      {(data?.edges || []).map((e, i) => {
        const a = byId[e.from], b = byId[e.to];
        if (!a || !b) return null;
        return (
          <Polyline key={i} positions={[[a.lat, a.lng], [b.lat, b.lng]]}
            pathOptions={{ color: "#7c3aed", weight: 1 + 6 * e.prob, dashArray: "5 6" }}>
            <Popup>Cascade: {a.title} → {b.title} ({Math.round(e.prob * 100)}%)</Popup>
          </Polyline>
        );
      })}
      {items.map((i) => (
        <CircleMarker key={i.id} center={[i.lat, i.lng]} radius={7 + 12 * i.p_disruption}
          pathOptions={{ color: color(i.p_disruption), fillColor: color(i.p_disruption), fillOpacity: 0.65 }}>
          <Popup>
            <b>{i.title}</b><br />{i.type} · {i.date}<br />
            Disruption {Math.round(i.p_disruption * 100)}% (80% range {Math.round(i.p10 * 100)}–{Math.round(i.p90 * 100)}%)<br />
            direct {Math.round(i.p_direct * 100)}% · cascade {Math.round(i.p_cascade * 100)}%
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}