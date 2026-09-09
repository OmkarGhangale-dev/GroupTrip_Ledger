from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from schemas.auth import GoogleLogin, Token, UserLogin, UserRead, UserRegister
import services.auth_service as svc

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    return await svc.register_user(db, data)


@router.post(
    "/login",
    response_model=Token,
)
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    return await svc.authenticate_user(db, data)


@router.post(
    "/google",
    response_model=Token,
)
async def google_login(
    data: GoogleLogin,
    db: AsyncSession = Depends(get_db),
):
    return await svc.authenticate_google_user(db, data)
