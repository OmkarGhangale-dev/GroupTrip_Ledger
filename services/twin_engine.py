"""
Weather Digital Twin - pure simulation engine (no DB, no network).

The twin is a *copy* of the trip (itinerary + bookings + spend) held in memory.
Every call to `simulate()` works on plain dicts and returns new numbers; it never
writes to the database, so what-if / counterfactual runs cannot touch the real
ledger.
"""
import math
import random
import statistics
from collections import defaultdict

# how exposed each kind of itinerary item is to outdoor weather (0..1)
EXPOSURE = {
    "ACTIVITY": 0.90, "FREE_TIME": 0.75, "TRANSPORT": 0.60,
    "MEAL": 0.30, "ACCOMMODATION": 0.10, "OTHER": 0.40,
}
# share of a booking's price typically lost if the item is cancelled by weather
NON_REFUNDABLE = {"ACTIVITY": 0.35, "TRANSPORT": 0.30, "ACCOMMODATION": 0.50,
                  "MEAL": 0.0, "FREE_TIME": 0.0, "OTHER": 0.10}


def sigmoid(x):
    return 1.0 / (1.0 + math.exp(-max(-30, min(30, x))))


def hazard(rain_mm_h, gust_kmh, tmax, tmin, wet_hours, social_boost=0.0):
    """Combine rain / wind / heat / cold into one 0..1 hazard index."""
    d = min(1.0, 0.4 + wet_hours / 8.0)                 # longer event -> worse
    h_rain = sigmoid((rain_mm_h - 7.0) / 3.0) * d
    h_wind = sigmoid((gust_kmh - 55.0) / 12.0)
    h_heat = sigmoid((tmax - 38.0) / 2.5)
    h_cold = sigmoid((3.0 - tmin) / 3.0)
    h = 1.0 - (1 - h_rain) * (1 - h_wind) * (1 - h_heat) * (1 - h_cold)
    h = h * (1.0 + 0.30 * social_boost)                 # social signal corroboration
    parts = {"rain": h_rain, "wind": h_wind, "heat": h_heat, "cold": h_cold}
    return min(1.0, h), parts


def apply_scenario(day, sc):
    """Return a copy of one forecast day with what-if overrides applied."""
    d = dict(day)
    if sc.get("rain_mm_h") is not None:
        d["rain_peak"] = float(sc["rain_mm_h"])
        d["rain_total"] = max(d["rain_total"], float(sc["rain_mm_h"]) * max(1.0, d["wet_hours"]))
    if sc.get("wind_kmh") is not None:
        d["gust_max"] = float(sc["wind_kmh"])
    if sc.get("temp_c") is not None:
        shift = float(sc["temp_c"]) - d["temp_max"]
        d["temp_max"] = float(sc["temp_c"])
        d["temp_min"] = d["temp_min"] + shift
    if sc.get("duration_h") is not None:
        d["wet_hours"] = float(sc["duration_h"])
    return d


def _lead_days(date_str, today_str):
    try:
        import datetime as dt
        return max(0, (dt.date.fromisoformat(date_str) - dt.date.fromisoformat(today_str)).days)
    except Exception:
        return 0


def simulate(items, bookings, days, scenario, ctx, n_samples=400, seed=7):
    """
    items      : [{id,title,type,date,start_hour,lat,lng,booking_id}]
    bookings   : [{id,type,amount}]
    days       : {date: {rain_peak,rain_total,gust_max,temp_max,temp_min,wet_hours,pop}}
    scenario   : {rain_mm_h,wind_kmh,temp_c,duration_h,day}   (all optional)
    ctx        : {today, budget, spent, participants, nights, accommodation_total,
                  social_boost, bias, total_days}
    """
    rng = random.Random(seed)
    scenario = scenario or {}
    only_day = scenario.get("day")
    bmap = {b["id"]: b for b in bookings}
    today = ctx["today"]
    social = ctx.get("social_boost", 0.0)
    bias = ctx.get("bias", 0.0)

    # 1) effective weather per day (after what-if)
    eff = {}
    for date, day in days.items():
        use_sc = scenario if (not only_day or only_day == date) else {}
        eff[date] = apply_scenario(day, use_sc)

    by_day = defaultdict(list)
    for it in items:
        by_day[it["date"]].append(it)
    for lst in by_day.values():
        lst.sort(key=lambda x: (x.get("start_hour") if x.get("start_hour") is not None else 12))

    per_item_p = defaultdict(list)          # sampled disruption prob
    direct_hits = defaultdict(int)
    cascade_hits = defaultdict(int)
    cost_samples, delayed_days_samples, cancelled_samples = [], [], []
    edge_counts = defaultdict(int)
    day_hazard_samples = defaultdict(list)

    for _ in range(n_samples):
        cost = 0.0
        cancelled_n = 0
        delayed_day_set = set()
        for date, lst in by_day.items():
            w = eff.get(date)
            if not w:
                continue
            lead = _lead_days(date, today)
            s = 0.18 + 0.05 * min(lead, 14)               # forecast uncertainty grows with lead time
            rain = max(0.0, w["rain_peak"] * math.exp(rng.gauss(0, s)))
            gust = max(0.0, w["gust_max"] * math.exp(rng.gauss(0, s * 0.7)))
            tmax = w["temp_max"] + rng.gauss(0, 0.6 + 0.25 * lead)
            tmin = w["temp_min"] + rng.gauss(0, 0.6 + 0.25 * lead)
            wet = max(0.0, w["wet_hours"] + rng.gauss(0, 1 + 0.2 * lead))
            H, _ = hazard(rain, gust, tmax, tmin, wet, social)
            H = min(1.0, max(0.0, H + bias))
            day_hazard_samples[date].append(H)

            prev_transport_delay = 0.0
            prev_transport_cancel = False
            prev_transport_id = None
            for it in lst:
                exp = EXPOSURE.get(it["type"], 0.4)
                p = min(1.0, H * exp)
                per_item_p[it["id"]].append(p)
                hit = rng.random() < p
                status = "ok"
                if hit:
                    direct_hits[it["id"]] += 1
                    if it["type"] == "TRANSPORT":
                        if rng.random() < 0.4 * H + 0.1:
                            status = "cancelled"
                        else:
                            status = "delayed"
                            prev_transport_delay = 1.0 + 4.0 * H
                    elif it["type"] in ("ACTIVITY", "FREE_TIME"):
                        status = "cancelled" if rng.random() < 0.55 else "delayed"
                    else:
                        status = "delayed"
                    if it["type"] == "TRANSPORT":
                        prev_transport_id = it["id"]
                        prev_transport_cancel = status == "cancelled"
                elif prev_transport_id and (prev_transport_cancel or prev_transport_delay > 1.5):
                    # 2nd-order: an earlier transport failure knocks this item over
                    cascade_hits[it["id"]] += 1
                    edge_counts[(prev_transport_id, it["id"])] += 1
                    status = "cancelled" if prev_transport_cancel and it["type"] != "ACCOMMODATION" else "delayed"
                    if it["type"] == "ACCOMMODATION" and prev_transport_cancel:
                        # 3rd-order: missed check-in -> extra night
                        cost += ctx.get("night_cost", 0.0)
                if status != "ok":
                    delayed_day_set.add(date)
                    b = bmap.get(it.get("booking_id"))
                    if status == "cancelled":
                        cancelled_n += 1
                        if b:
                            cost += b["amount"] * NON_REFUNDABLE.get(it["type"], 0.1)
                        if it["type"] == "TRANSPORT" and b:
                            cost += b["amount"] * 0.35      # re-booking premium
                    elif b:
                        cost += b["amount"] * 0.03
            if any(True for _ in lst) and H > 0.15:
                # 3rd-order: disrupted day -> extra local spend (taxis, indoor food)
                cost += ctx.get("daily_budget", 0.0) * 0.25 * H
        cost_samples.append(cost)
        cancelled_samples.append(cancelled_n)
        delayed_days_samples.append(len(delayed_day_set))

    def q(vals, pct):
        v = sorted(vals)
        return v[min(len(v) - 1, max(0, int(round(pct * (len(v) - 1)))))] if v else 0.0

    out_items = []
    for it in items:
        ps = per_item_p.get(it["id"], [0.0])
        out_items.append({
            **{k: it.get(k) for k in ("id", "title", "type", "date", "lat", "lng", "location")},
            "p_disruption": round(statistics.mean(ps), 3),
            "p10": round(q(ps, 0.10), 3), "p90": round(q(ps, 0.90), 3),
            "p_direct": round(direct_hits[it["id"]] / n_samples, 3),
            "p_cascade": round(cascade_hits[it["id"]] / n_samples, 3),
        })

    spent = ctx.get("spent", 0.0)
    budget = ctx.get("budget") or 0.0
    over = sum(1 for c in cost_samples if budget and spent + c > budget) / n_samples if budget else 0.0
    mean_cost = statistics.mean(cost_samples) if cost_samples else 0.0
    n_people = max(1, ctx.get("participants", 1))

    day_out = []
    for date in sorted(eff):
        w = eff[date]
        hs = day_hazard_samples.get(date, [0.0])
        day_out.append({
            "date": date,
            "rain_peak": round(w["rain_peak"], 1), "rain_total": round(w["rain_total"], 1),
            "gust_max": round(w["gust_max"], 0), "temp_max": round(w["temp_max"], 1),
            "temp_min": round(w["temp_min"], 1), "wet_hours": round(w["wet_hours"], 1),
            "hazard": round(statistics.mean(hs), 3),
            "hazard_p10": round(q(hs, 0.10), 3), "hazard_p90": round(q(hs, 0.90), 3),
        })

    overall = statistics.mean([d["hazard"] for d in day_out]) if day_out else 0.0
    peak = max([d["hazard"] for d in day_out], default=0.0)
    level = "extreme" if peak >= 0.75 else "high" if peak >= 0.5 else "moderate" if peak >= 0.25 else "low"

    edges = [{"from": a, "to": b, "prob": round(c / n_samples, 3)}
             for (a, b), c in edge_counts.items() if c / n_samples >= 0.02]

    return {
        "risk_level": level, "overall_hazard": round(overall, 3), "peak_hazard": round(peak, 3),
        "days": day_out, "items": out_items, "edges": edges,
        "finance": {
            "expected_extra_cost": round(mean_cost, 2),
            "cost_p10": round(q(cost_samples, 0.10), 2), "cost_p90": round(q(cost_samples, 0.90), 2),
            "per_person_extra": round(mean_cost / n_people, 2),
            "spent_so_far": round(spent, 2), "budget": round(budget, 2),
            "projected_total": round(spent + mean_cost, 2),
            "budget_used_pct": round((spent + mean_cost) / budget * 100, 1) if budget else None,
            "prob_over_budget": round(over, 3),
        },
        "itinerary": {
            "expected_cancellations": round(statistics.mean(cancelled_samples), 2) if cancelled_samples else 0,
            "expected_disrupted_days": round(statistics.mean(delayed_days_samples), 2) if delayed_days_samples else 0,
            "n_items": len(items),
        },
        "samples": n_samples,
    }


def diff(base, sim):
    """Counterfactual delta: simulated world minus the real-forecast world."""
    return {
        "hazard": round(sim["overall_hazard"] - base["overall_hazard"], 3),
        "extra_cost": round(sim["finance"]["expected_extra_cost"] - base["finance"]["expected_extra_cost"], 2),
        "per_person": round(sim["finance"]["per_person_extra"] - base["finance"]["per_person_extra"], 2),
        "cancellations": round(sim["itinerary"]["expected_cancellations"] - base["itinerary"]["expected_cancellations"], 2),
        "prob_over_budget": round(sim["finance"]["prob_over_budget"] - base["finance"]["prob_over_budget"], 3),
    }