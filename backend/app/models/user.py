from typing import Optional
from sqlalchemy import Boolean, String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from backend.app.models.enums import UserRole


class User(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    """User account entity for authentication and preferences."""
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum"),
        default=UserRole.USER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
