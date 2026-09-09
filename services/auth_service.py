from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.auth import GoogleLogin, UserLogin, UserRegister
from utils.security import create_access_token, hash_password, verify_password
from app.config import settings


async def register_user(db: AsyncSession, data: UserRegister) -> User:
    email_clean = data.email.lower().strip()
    query = select(User).where(User.email == email_clean)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    hashed = hash_password(data.password)
    user = User(
        name=data.name.strip(),
        email=email_clean,
        password_hash=hashed,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, data: UserLogin):
    email_clean = data.email.lower().strip()
    query = select(User).where(User.email == email_clean)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "name": user.name}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


async def authenticate_google_user(db: AsyncSession, data: GoogleLogin):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication is not configured on the server",
        )

    try:
        claims = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = str(claims.get("email", "")).lower().strip()
    name = str(claims.get("name", "")).strip() or email.split("@", 1)[0]
    email_verified = claims.get("email_verified") is True

    if not email or not email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email could not be verified",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(name=name[:150], email=email, password_hash=None)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif not user.name and name:
        user.name = name[:150]
        await db.commit()
        await db.refresh(user)

    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "name": user.name}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }
