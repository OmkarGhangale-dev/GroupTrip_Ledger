"""Live weather via Open-Meteo (free, no API key). Results cached 10 min."""
import time
import httpx

_CACHE: dict = {}
_TTL = 600
GEO = "https://geocoding-api.open-meteo.com/v1/search"
FC = "https://api.open-meteo.com/v1/forecast"


CURRENCY_COUNTRY = {
    "INR": "in", "USD": "us", "GBP": "gb", "AUD": "au", "CAD": "ca", "JPY": "jp", "THB": "th",
    "SGD": "sg", "AED": "ae", "IDR": "id", "MYR": "my", "LKR": "lk", "NPR": "np", "CHF": "ch",
    "NZD": "nz", "ZAR": "za", "TRY": "tr", "VND": "vn",
}
_UA = {"User-Agent": "GroupTripLedger/1.0 (hackathon project)"}


async def _nominatim(client, q, cc):
    params = {"q": q, "format": "jsonv2", "limit": 1, "addressdetails": 1}
    if cc:
        params["countrycodes"] = cc
    r = await client.get("https://nominatim.openstreetmap.org/search", params=params, headers=_UA)
    res = r.json()
    if not res:
        return None
    x = res[0]
    parts = [p.strip() for p in x.get("display_name", q).split(",")]
    label = ", ".join(parts[:1] + parts[-3:-1]) if len(parts) > 3 else ", ".join(parts)
    return {"lat": float(x["lat"]), "lng": float(x["lon"]), "label": label}


async def geocode(name: str, currency: str | None = None):
    """Trip destination -> coordinates. Uses OpenStreetMap search, biased by the trip currency's country."""
    cc = CURRENCY_COUNTRY.get((currency or "").upper())
    key = ("geo", name.lower(), cc)
    if key in _CACHE:
        return _CACHE[key]
    out = None
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            out = await _nominatim(c, name, cc) or await _nominatim(c, name, None)
            if not out:                                   # last resort: Open-Meteo search
                r = await c.get(GEO, params={"name": name.split(",")[0], "count": 1})
                res = (r.json().get("results") or [None])[0]
                if res:
                    out = {"lat": res["latitude"], "lng": res["longitude"],
                           "label": ", ".join(v for v in (res["name"], res.get("admin1"), res.get("country")) if v)}
    except Exception:
        out = None
    if out:
        _CACHE[key] = out
    return out


async def fetch_forecast(lat: float, lng: float):
    """Returns {'current': {...}, 'days': {date: {...}}, 'source': 'open-meteo'} or None."""
    key = ("fc", round(lat, 2), round(lng, 2))
    hit = _CACHE.get(key)
    if hit and time.time() - hit[0] < _TTL:
        return hit[1]
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(FC, params={
                "latitude": lat, "longitude": lng, "timezone": "auto", "forecast_days": 16,
                "current": "temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,weather_code",
                "hourly": "temperature_2m,precipitation,wind_gusts_10m,precipitation_probability",
            })
            j = r.json()
        h = j["hourly"]
        days: dict = {}
        for i, t in enumerate(h["time"]):
            d = t[:10]
            x = days.setdefault(d, {"p": [], "g": [], "t": [], "pop": []})
            x["p"].append(h["precipitation"][i] or 0.0)
            x["g"].append(h["wind_gusts_10m"][i] or 0.0)
            x["t"].append(h["temperature_2m"][i] if h["temperature_2m"][i] is not None else 25.0)
            x["pop"].append(h["precipitation_probability"][i] or 0)
        out_days = {}
        for d, x in days.items():
            out_days[d] = {
                "rain_peak": max(x["p"]), "rain_total": sum(x["p"]),
                "gust_max": max(x["g"]), "temp_max": max(x["t"]), "temp_min": min(x["t"]),
                "wet_hours": float(sum(1 for v in x["p"] if v >= 0.5)), "pop": max(x["pop"]),
            }
        out = {"current": j.get("current", {}), "days": out_days, "source": "open-meteo",
               "fetched_at": time.time()}
        _CACHE[key] = (time.time(), out)
        return out
    except Exception:
        return None


def demo_forecast(start_date: str, n: int = 7):
    """Only used if Open-Meteo is unreachable. Clearly flagged source='fallback'."""
    import datetime as dt
    d0 = dt.date.fromisoformat(start_date)
    days = {}
    for i in range(n):
        d = (d0 + dt.timedelta(days=i)).isoformat()
        days[d] = {"rain_peak": 1.5 + (i % 3), "rain_total": 6.0, "gust_max": 28.0,
                   "temp_max": 31.0, "temp_min": 24.0, "wet_hours": 3.0, "pop": 40}
    return {"current": {}, "days": days, "source": "fallback", "fetched_at": time.time()}


async def fetch_dashboard(lat: float, lng: float):
    """Full live weather for the dashboard: now + next 24h + 7 days (+ air quality if available)."""
    key = ("dash", round(lat, 2), round(lng, 2))
    hit = _CACHE.get(key)
    if hit and time.time() - hit[0] < 300:
        return hit[1]
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(FC, params={
                "latitude": lat, "longitude": lng, "timezone": "auto", "forecast_days": 7,
                "current": ("temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,"
                            "weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,"
                            "wind_gusts_10m,is_day"),
                "hourly": "temperature_2m,precipitation_probability,precipitation,weather_code",
                "daily": ("weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,"
                          "precipitation_probability_max,wind_gusts_10m_max,sunrise,sunset,uv_index_max"),
            })
            j = r.json()
            aqi = None
            try:
                a = await c.get("https://air-quality-api.open-meteo.com/v1/air-quality",
                                params={"latitude": lat, "longitude": lng, "current": "us_aqi,pm2_5"})
                aqi = a.json().get("current")
            except Exception:
                pass
        # keep only the next 24 hourly points starting from the current hour
        now = (j.get("current") or {}).get("time", "")[:13]
        h = j["hourly"]
        start = next((i for i, t in enumerate(h["time"]) if t[:13] >= now), 0)
        hourly = [{"time": h["time"][i], "temp": h["temperature_2m"][i],
                   "pop": h["precipitation_probability"][i], "rain": h["precipitation"][i],
                   "code": h["weather_code"][i]} for i in range(start, min(start + 24, len(h["time"])))]
        d = j["daily"]
        daily = [{"date": d["time"][i], "code": d["weather_code"][i], "tmax": d["temperature_2m_max"][i],
                  "tmin": d["temperature_2m_min"][i], "rain": d["precipitation_sum"][i],
                  "pop": d["precipitation_probability_max"][i], "gust": d["wind_gusts_10m_max"][i],
                  "sunrise": d["sunrise"][i], "sunset": d["sunset"][i], "uv": d["uv_index_max"][i]}
                 for i in range(len(d["time"]))]
        out = {"current": j["current"], "hourly": hourly, "daily": daily, "air": aqi,
               "timezone": j.get("timezone"), "source": "open-meteo"}
        _CACHE[key] = (time.time(), out)
        return out
    except Exception:
        return None