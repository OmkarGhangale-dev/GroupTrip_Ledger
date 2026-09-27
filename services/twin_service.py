import datetime as dt
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.booking import Booking, BookingStatus
from models.expense import Expense
from models.itinerary import ItineraryItem
from models.participant import Participant
from models.twin import TwinModelState
from services import weather_service, social_service
from services.twin_engine import simulate, diff


def _hour(t):
    return t.hour + t.minute / 60 if t else None


async def _load(db: AsyncSession, trip):
    tid = trip.id
    its = (await db.execute(select(ItineraryItem).where(ItineraryItem.trip_id == tid))).scalars().all()
    bks = (await db.execute(select(Booking).where(Booking.trip_id == tid))).scalars().all()
    exps = (await db.execute(select(Expense).where(Expense.trip_id == tid))).scalars().all()
    parts = (await db.execute(select(Participant).where(Participant.trip_id == tid))).scalars().all()
    st = (await db.execute(select(TwinModelState).where(TwinModelState.trip_id == tid))).scalar_one_or_none()
    return its, bks, exps, parts, st


def _active(p):
    return str(getattr(p.status, "value", p.status)).lower() == "active"


async def build_state(db: AsyncSession, trip, scenario: dict | None = None):
    scenario = scenario or {}
    its, bks, exps, parts, st = await _load(db, trip)

    # --- location & live weather ---------------------------------------
    geo = await weather_service.geocode(trip.destination or "", trip.currency)
    lat = scenario.get("lat") if scenario.get("lat") is not None else (geo or {}).get("lat")
    lng = scenario.get("lng") if scenario.get("lng") is not None else (geo or {}).get("lng")
    moved = scenario.get("lat") is not None and scenario.get("lng") is not None
    fc = await weather_service.fetch_forecast(lat, lng) if lat is not None else None
    if not fc:
        fc = weather_service.demo_forecast((trip.start_date or dt.date.today()).isoformat())

    # --- map trip days onto forecast days -------------------------------
    today = dt.date.today()
    s = trip.start_date or today
    e = trip.end_date or (s + dt.timedelta(days=3))
    trip_days = [(s + dt.timedelta(days=i)) for i in range((e - s).days + 1)]
    fdates = sorted(fc["days"])
    days, outside = {}, False
    for d in trip_days:
        k = d.isoformat()
        if k in fc["days"]:
            days[k] = fc["days"][k]
        else:  # outside the 16-day horizon -> use nearest available day as proxy
            outside = True
            idx = min(max((d - today).days, 0), len(fdates) - 1)
            days[k] = fc["days"][fdates[idx]]
    total_days = max(1, len(trip_days))

    # --- twin copy of the real system -----------------------------------
    base_lat = lat if lat is not None else 0.0
    base_lng = lng if lng is not None else 0.0
    items = []
    for i, it in enumerate(its):
        if not it.date:
            continue
        items.append({
            "id": str(it.id), "title": it.title, "type": (it.item_type or "OTHER").upper(),
            "date": it.date.isoformat(), "start_hour": _hour(it.start_time),
            "lat": it.latitude if it.latitude is not None else base_lat + 0.01 * ((i % 5) - 2),
            "lng": it.longitude if it.longitude is not None else base_lng + 0.01 * ((i // 5) - 1),
            "location": it.location, "booking_id": str(it.booking_id) if it.booking_id else None,
        })
        if it.date.isoformat() not in days:
            days[it.date.isoformat()] = fc["days"][fdates[0]]
    live_b = [b for b in bks if b.status not in (BookingStatus.CANCELLED, BookingStatus.REFUNDED)]
    bookings = [{"id": str(b.id), "type": b.booking_type.value, "amount": float(b.amount or 0)} for b in live_b]
    acc = sum(b["amount"] for b in bookings if b["type"] == "hotel")
    nights = max(1, total_days - 1)
    spent = sum(float(x.amount or 0) for x in exps)
    budget = float(trip.budget or 0)
    n_people = max(1, len([p for p in parts if _active(p)]))

    # --- social signals ---------------------------------------------------
    pre = simulate(items, bookings, days, {}, dict(
        today=today.isoformat(), budget=budget, spent=spent, participants=n_people,
        night_cost=acc / nights, daily_budget=(budget / total_days) if budget else 0.0), n_samples=80)
    social = await social_service.fetch_signals(trip.destination or "", pre["peak_hazard"])

    ctx = dict(today=today.isoformat(), budget=budget, spent=spent, participants=n_people,
               night_cost=acc / nights, daily_budget=(budget / total_days) if budget else 0.0,
               social_boost=social["social_boost"], bias=(st.bias if st else 0.0))
    seed = int(uuid.UUID(str(trip.id)).int % 100000)
    baseline = simulate(items, bookings, days, {}, ctx, seed=seed)
    result = {"baseline": baseline}
    if any(scenario.get(k) is not None for k in ("rain_mm_h", "wind_kmh", "temp_c", "duration_h", "lat")):
        sc = {k: v for k, v in scenario.items() if k not in ("lat", "lng")}
        whatif = simulate(items, bookings, days, sc, ctx, seed=seed)
        result["scenario"] = whatif
        result["delta"] = diff(baseline, whatif)
    result.update({
        "trip": {"id": str(trip.id), "name": trip.name, "destination": trip.destination,
                 "currency": trip.currency, "center": {"lat": lat, "lng": lng}},
        "weather": {"source": fc["source"], "current": fc.get("current", {}),
                    "place": (geo or {}).get("label"), "outside_horizon": outside, "location_moved": moved,
                    "as_of": dt.datetime.utcnow().isoformat() + "Z"},
        "social": social,
        "model": {"bias": st.bias if st else 0.0, "feedback_n": st.n_feedback if st else 0},
        "note": "Simulation runs on an in-memory copy. Nothing here changes your real expenses, bookings or itinerary.",
    })
    return result


async def apply_feedback(db: AsyncSession, trip, observed: float, predicted: float):
    """Online learning: nudge per-trip bias toward what actually happened."""
    st = (await db.execute(select(TwinModelState).where(TwinModelState.trip_id == trip.id))).scalar_one_or_none()
    if not st:
        st = TwinModelState(trip_id=trip.id, bias=0.0, n_feedback=0)
        db.add(st)
    lr = max(0.05, 1.0 / (st.n_feedback + 4))
    st.bias = max(-0.3, min(0.3, st.bias + lr * (observed - predicted)))
    st.n_feedback += 1
    await db.commit()
    return {"bias": st.bias, "feedback_n": st.n_feedback}