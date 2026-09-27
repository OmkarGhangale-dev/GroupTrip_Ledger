"""
Public social / news signals about a weather event near the destination.
  * Mastodon public hashtag timelines (no key needed)
  * GDELT DOC 2.0 news search (no key needed)
Each item is keyword-scored; a 0..1 'social_boost' feeds the twin's hazard.
"""
import html
import re
import time
import httpx

_CACHE: dict = {}
_TTL = 600
HAZ = {
    "cyclone": 1.0, "flood": 0.9, "flooding": 0.9, "landslide": 0.9, "evacuat": 1.0,
    "red alert": 1.0, "orange alert": 0.8, "storm": 0.7, "heatwave": 0.8, "heat wave": 0.8,
    "cancel": 0.6, "closed": 0.5, "delay": 0.4, "heavy rain": 0.7, "waterlog": 0.7,
    "warning": 0.5, "stranded": 0.8, "power cut": 0.5, "roadblock": 0.5,
}
TAG = re.compile(r"<[^>]+>")
URL = re.compile(r"https?://\S+")
HASH = re.compile(r"#\s*\w*")


def clean(t: str) -> str:
    """Decode &#39; etc., drop raw links and hashtags, tidy spaces."""
    t = re.sub(r"</p>|<br\s*/?>", " ", t or "")
    t = html.unescape(TAG.sub("", t))
    t = HASH.sub("", URL.sub("", t))
    return re.sub(r"\s+", " ", t).strip()


def _score(text: str) -> float:
    t = text.lower()
    hits = [w for k, w in HAZ.items() if k in t]
    return round(min(1.0, sum(hits) / 2.0), 2) if hits else 0.0


def _slug(place: str) -> str:
    return re.sub(r"[^a-z0-9]", "", place.split(",")[0].lower())


async def _mastodon(place: str):
    out = []
    slug = _slug(place)
    async with httpx.AsyncClient(timeout=8) as c:
        for tag in (f"{slug}weather", slug, "weatheralert"):
            try:
                r = await c.get(f"https://mastodon.social/api/v1/timelines/tag/{tag}", params={"limit": 15})
                for s in r.json():
                    txt = clean(s.get("content", ""))
                    if tag == "weatheralert" and slug not in txt.lower():
                        continue
                    out.append({"source": "mastodon", "text": txt[:240],
                                "url": s.get("url"), "time": s.get("created_at"),
                                "score": _score(txt)})
            except Exception:
                continue
    return out


async def _gdelt(place: str):
    q = f'"{place.split(",")[0]}" (weather OR rain OR cyclone OR flood OR heatwave OR storm)'
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get("https://api.gdeltproject.org/api/v2/doc/doc", params={
                "query": q, "mode": "artlist", "format": "json", "maxrecords": 15, "timespan": "3d"})
            arts = r.json().get("articles", [])
        return [{"source": a.get("domain", "news"), "text": clean(a.get("title", ""))[:240],
                 "url": a.get("url"), "time": a.get("seendate"), "score": _score(a.get("title", ""))}
                for a in arts]
    except Exception:
        return []


async def fetch_signals(place: str, forecast_hazard: float = 0.0):
    key = place.lower()
    hit = _CACHE.get(key)
    if hit and time.time() - hit[0] < _TTL:
        return hit[1]
    posts = (await _mastodon(place)) + (await _gdelt(place))
    live = True
    if not posts:
        live = False
        posts = [  # clearly-labelled sample so the demo works offline
            {"source": "sample", "text": f"Heavy rain warning issued near {place}; some roads waterlogged.",
             "url": None, "time": None, "score": 0.7},
            {"source": "sample", "text": f"Tourists in {place} report ferry delays after strong winds.",
             "url": None, "time": None, "score": 0.5},
        ]
    posts.sort(key=lambda p: p["score"], reverse=True)
    scored = [p["score"] for p in posts if p["score"] > 0]
    volume = min(1.0, len(scored) / 10.0)
    intensity = sum(scored) / len(scored) if scored else 0.0
    boost = round(min(1.0, 0.6 * intensity + 0.4 * volume), 2) if scored else 0.0
    out = {"live": live, "count": len(posts), "signals": len(scored), "social_boost": boost,
           "top": posts[:8],
           "agreement": ("corroborates forecast" if boost >= 0.3 and forecast_hazard >= 0.3
                         else "chatter without forecast support" if boost >= 0.3
                         else "quiet")}
    _CACHE[key] = (time.time(), out)
    return out