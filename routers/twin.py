import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from utils.deps import get_current_user
from schemas.twin import Scenario, Feedback
import services.trip_service as trip_svc
import services.twin_service as twin

router = APIRouter(prefix="/twin", tags=["Weather Digital Twin"])


async def _trip(db, trip_id, user):
    trip = await trip_svc.get_trip(db, trip_id, user)
    if not trip:
        raise HTTPException(404, "Trip not found")
    return trip


@router.get("/{trip_id}/state")
async def state(trip_id: uuid.UUID, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await twin.build_state(db, await _trip(db, trip_id, user))


@router.post("/{trip_id}/simulate")
async def simulate_whatif(trip_id: uuid.UUID, sc: Scenario, db: AsyncSession = Depends(get_db),
                          user=Depends(get_current_user)):
    return await twin.build_state(db, await _trip(db, trip_id, user), sc.model_dump())


@router.post("/{trip_id}/feedback")
async def feedback(trip_id: uuid.UUID, fb: Feedback, db: AsyncSession = Depends(get_db),
                   user=Depends(get_current_user)):
    trip = await _trip(db, trip_id, user)
    cur = await twin.build_state(db, trip)
    return await twin.apply_feedback(db, trip, fb.observed_severity, cur["baseline"]["peak_hazard"])


@router.get("/{trip_id}/weather")
async def live_weather(trip_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                       user=Depends(get_current_user)):
    """Real-time weather for the trip's destination (Open-Meteo, no API key)."""
    from services import weather_service
    trip = await _trip(db, trip_id, user)
    geo = await twin.resolve_location(db, trip)
    if not geo:
        raise HTTPException(404, f'Could not locate "{trip.destination}". Edit the trip and use a simple place name like "Goa, India".')
    data = await weather_service.fetch_dashboard(geo["lat"], geo["lng"])
    if not data:
        data = weather_service.demo_dashboard(geo["lat"], geo["lng"])   # labelled as sample
    return {"place": geo["label"], "lat": geo["lat"], "lng": geo["lng"],
            "trip_start": str(trip.start_date) if trip.start_date else None,
            "trip_end": str(trip.end_date) if trip.end_date else None, **data}