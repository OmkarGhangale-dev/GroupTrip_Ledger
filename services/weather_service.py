"""Live weather via Open-Meteo (free, no API key). Results cached 10 min."""
import asyncio
import re
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


# Built-in destinations: checked first so common trips work offline and never hit rate limits.
KNOWN = {
    # Indian states / regions
    "rajasthan": (26.9124, 75.7873, "Rajasthan, India"), "kerala": (10.8505, 76.2711, "Kerala, India"),
    "goa": (15.2993, 74.1240, "Goa, India"), "himachal": (31.1048, 77.1734, "Himachal Pradesh, India"),
    "uttarakhand": (30.0668, 79.0193, "Uttarakhand, India"), "kashmir": (34.0837, 74.7973, "Srinagar, Kashmir, India"),
    "ladakh": (34.1526, 77.5770, "Leh, Ladakh, India"), "sikkim": (27.5330, 88.5122, "Sikkim, India"),
    "gujarat": (23.0225, 72.5714, "Gujarat, India"), "maharashtra": (19.0760, 72.8777, "Maharashtra, India"),
    "karnataka": (12.9716, 77.5946, "Karnataka, India"), "tamil nadu": (13.0827, 80.2707, "Tamil Nadu, India"),
    "andaman": (11.6234, 92.7265, "Andaman, India"), "meghalaya": (25.5788, 91.8933, "Shillong, Meghalaya, India"),
    "punjab": (31.6340, 74.8723, "Punjab, India"), "assam": (26.1445, 91.7362, "Assam, India"),
    # Indian cities / tourist spots
    "jaipur": (26.9124, 75.7873, "Jaipur, India"), "udaipur": (24.5854, 73.7125, "Udaipur, India"),
    "jodhpur": (26.2389, 73.0243, "Jodhpur, India"), "jaisalmer": (26.9157, 70.9083, "Jaisalmer, India"),
    "pushkar": (26.4899, 74.5511, "Pushkar, India"), "mumbai": (19.0760, 72.8777, "Mumbai, India"),
    "pune": (18.5204, 73.8567, "Pune, India"), "delhi": (28.6139, 77.2090, "Delhi, India"),
    "agra": (27.1767, 78.0081, "Agra, India"), "varanasi": (25.3176, 82.9739, "Varanasi, India"),
    "rishikesh": (30.0869, 78.2676, "Rishikesh, India"), "manali": (32.2396, 77.1887, "Manali, India"),
    "shimla": (31.1048, 77.1734, "Shimla, India"), "dharamshala": (32.2190, 76.3234, "Dharamshala, India"),
    "darjeeling": (27.0360, 88.2627, "Darjeeling, India"), "gangtok": (27.3389, 88.6065, "Gangtok, India"),
    "kolkata": (22.5726, 88.3639, "Kolkata, India"), "chennai": (13.0827, 80.2707, "Chennai, India"),
    "bengaluru": (12.9716, 77.5946, "Bengaluru, India"), "bangalore": (12.9716, 77.5946, "Bengaluru, India"),
    "hyderabad": (17.3850, 78.4867, "Hyderabad, India"), "kochi": (9.9312, 76.2673, "Kochi, India"),
    "munnar": (10.0889, 77.0595, "Munnar, India"), "alleppey": (9.4981, 76.3388, "Alleppey, India"),
    "ooty": (11.4102, 76.6950, "Ooty, India"), "mysore": (12.2958, 76.6394, "Mysuru, India"),
    "hampi": (15.3350, 76.4600, "Hampi, India"), "pondicherry": (11.9416, 79.8083, "Puducherry, India"),
    "amritsar": (31.6340, 74.8723, "Amritsar, India"), "leh": (34.1526, 77.5770, "Leh, India"),
    "srinagar": (34.0837, 74.7973, "Srinagar, India"), "lonavala": (18.7546, 73.4062, "Lonavala, India"),
    "mahabaleshwar": (17.9237, 73.6586, "Mahabaleshwar, India"), "nashik": (19.9975, 73.7898, "Nashik, India"),
    "ahmedabad": (23.0225, 72.5714, "Ahmedabad, India"), "kutch": (23.7337, 69.8597, "Kutch, India"),
    "ranthambore": (26.0173, 76.5026, "Ranthambore, India"), "mount abu": (24.5926, 72.7156, "Mount Abu, India"),
    # International
    "bangkok": (13.7563, 100.5018, "Bangkok, Thailand"), "phuket": (7.8804, 98.3923, "Phuket, Thailand"),
    "thailand": (13.7563, 100.5018, "Thailand"), "bali": (-8.4095, 115.1889, "Bali, Indonesia"),
    "singapore": (1.3521, 103.8198, "Singapore"), "dubai": (25.2048, 55.2708, "Dubai, UAE"),
    "maldives": (4.1755, 73.5093, "Maldives"), "paris": (48.8566, 2.3522, "Paris, France"),
    "london": (51.5072, -0.1276, "London, UK"), "new york": (40.7128, -74.0060, "New York, USA"),
    "tokyo": (35.6762, 139.6503, "Tokyo, Japan"), "sri lanka": (7.8731, 80.7718, "Sri Lanka"),
    "nepal": (27.7172, 85.3240, "Kathmandu, Nepal"), "bhutan": (27.4728, 89.6390, "Thimphu, Bhutan"),
}


def _known(name: str):
    low = re.sub(r"[^a-z ]", " ", (name or "").lower())
    for k in sorted(KNOWN, key=len, reverse=True):          # longest match wins ("mount abu" before "abu")
        if re.search(r"\b" + re.escape(k) + r"\b", low):
            lat, lng, label = KNOWN[k]
            return {"lat": lat, "lng": lng, "label": label}
    return None


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
    """Trip destination -> coordinates. Tries the full text, then its parts, then single words."""
    cc = CURRENCY_COUNTRY.get((currency or "").upper())
    full = (name or "").strip()
    key = ("geo", full.lower(), cc)
    if key in _CACHE:
        return _CACHE[key]
    if not full:
        return None
    hit = _known(full)
    if hit:
        _CACHE[key] = hit
        return hit

    variants = []
    parts = [p.strip() for p in re.split(r"[,\-/|()]", full) if p.strip()]
    words = [w for w in re.split(r"[\s,]+", full) if len(w) >= 4]
    for v in [full] + parts + words:
        if v and v.lower() not in [x.lower() for x in variants]:
            variants.append(v)

    out = None
    async with httpx.AsyncClient(timeout=10) as c:
        for i, v in enumerate(variants[:6]):
            if i:
                await asyncio.sleep(1.1)              # be polite to the free geocoder
            try:
                out = await _nominatim(c, v, cc) or (await _nominatim(c, v, None) if cc else None)
            except Exception:
                out = None
            if not out:
                try:
                    r = await c.get(GEO, params={"name": v.split(",")[0], "count": 1})
                    res = (r.json().get("results") or [None])[0]
                    if res:
                        out = {"lat": res["latitude"], "lng": res["longitude"],
                               "label": ", ".join(x for x in (res["name"], res.get("admin1"), res.get("country")) if x)}
                except Exception:
                    out = None
            if out:
                break
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
            r.raise_for_status()
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
    except Exception as e:
        print("weather forecast fetch failed:", repr(e))
        return hit[1] if hit else None


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
            r.raise_for_status()
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
    except Exception as e:
        print("weather dashboard fetch failed:", repr(e))
        hit = _CACHE.get(key)
        return hit[1] if hit else None


def demo_dashboard(lat: float, lng: float):
    """Used only when the live feed is unreachable. Clearly labelled so nobody mistakes it for real data."""
    import datetime as dt
    now = dt.datetime.now().replace(minute=0, second=0, microsecond=0)
    hourly = [{"time": (now + dt.timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M"),
               "temp": round(27 + 4 * (1 if 6 <= (now.hour + i) % 24 <= 17 else -1) * 0.7, 1),
               "pop": 20 + (i * 7) % 40, "rain": 0.0, "code": 2} for i in range(24)]
    today = dt.date.today()
    daily = [{"date": (today + dt.timedelta(days=i)).isoformat(), "code": 2 if i % 3 else 61,
              "tmax": 32.0 - (i % 3), "tmin": 24.0, "rain": 1.5 * (i % 3), "pop": 30 + 10 * (i % 4),
              "gust": 30.0, "sunrise": f"{today}T06:10", "sunset": f"{today}T18:40", "uv": 7}
             for i in range(7)]
    cur = {"time": now.strftime("%Y-%m-%dT%H:%M"), "temperature_2m": 29.0, "apparent_temperature": 31.0,
           "relative_humidity_2m": 60, "precipitation": 0.0, "weather_code": 2, "cloud_cover": 40,
           "surface_pressure": 1008, "wind_speed_10m": 10, "wind_direction_10m": 200,
           "wind_gusts_10m": 20, "is_day": 1}
    return {"current": cur, "hourly": hourly, "daily": daily, "air": None,
            "timezone": None, "source": "sample data (live weather feed unreachable)"}