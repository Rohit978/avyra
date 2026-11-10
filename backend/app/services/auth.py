from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import hash_password, verify_password
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.schemas.auth import UserProfileUpdateRequest, UserRegisterRequest


class AuthService:
    @staticmethod
    async def register_user(db: AsyncSession, req: UserRegisterRequest) -> User:
        # Check if username or email is already taken
        stmt = select(User).where(
            or_(
                func.lower(User.username) == req.username.lower(),
                func.lower(User.email) == req.email.lower(),
            )
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            if existing.username.lower() == req.username.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username is already taken.",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already registered.",
                )

        new_user = User(
            username=req.username,
            email=req.email.lower(),
            hashed_password=hash_password(req.password),
            role=UserRole.USER,
            is_active=True,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        login: str,
        password: str,
    ) -> Optional[User]:
        clean_login = login.strip().lower()
        stmt = select(User).where(
            or_(
                func.lower(User.email) == clean_login,
                func.lower(User.username) == clean_login,
            )
        )
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return user

    @staticmethod
    async def update_profile(
        db: AsyncSession,
        user: User,
        req: UserProfileUpdateRequest,
    ) -> User:
        # If changing password, current password must match
        if req.new_password:
            if not req.current_password or not verify_password(
                req.current_password, user.hashed_password
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect.",
                )
            user.hashed_password = hash_password(req.new_password)

        # If changing username, check availability
        if req.username and req.username.lower() != user.username.lower():
            res = await db.execute(
                select(User).where(
                    func.lower(User.username) == req.username.lower(),
                    User.id != user.id,
                )
            )
            if res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username is already taken.",
                )
            user.username = req.username

        # If changing email, check availability
        if req.email and req.email.lower() != user.email.lower():
            res = await db.execute(
                select(User).where(
                    func.lower(User.email) == req.email.lower(),
                    User.id != user.id,
                )
            )
            if res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already registered.",
                )
            user.email = req.email.lower()

        if req.avatar_url is not None:
            user.avatar_url = req.avatar_url

        await db.commit()
        await db.refresh(user)
        return user
