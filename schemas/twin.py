from pydantic import BaseModel, Field


class Scenario(BaseModel):
    rain_mm_h: float | None = Field(None, ge=0, le=200)
    wind_kmh: float | None = Field(None, ge=0, le=350)
    temp_c: float | None = Field(None, ge=-30, le=60)
    duration_h: float | None = Field(None, ge=0, le=24)
    day: str | None = None          # YYYY-MM-DD, None = every trip day
    lat: float | None = None        # move the event to another location
    lng: float | None = None


class Feedback(BaseModel):
    observed_severity: float = Field(..., ge=0, le=1)