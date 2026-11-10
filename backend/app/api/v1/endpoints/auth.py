from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_active_user
from backend.app.core.security import create_access_token
from backend.app.models.user import User
from backend.app.schemas.auth import (
    TokenResponseDTO,
    UserLoginRequest,
    UserProfileUpdateRequest,
    UserRegisterRequest,
    UserResponseDTO,
)
from backend.app.services.auth import AuthService

router = APIRouter()


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in HTTPS production
        samesite="lax",
        max_age=86400,  # 24 hours
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
    )


@router.post("/register", response_model=TokenResponseDTO, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register(
    req: UserRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account with Argon2id password hashing."""
    user = await AuthService.register_user(db, req)
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    _set_auth_cookie(response, token)
    return TokenResponseDTO(
        access_token=token,
        token_type="bearer",
        user=UserResponseDTO.model_validate(user),
    )


@router.post("/login", response_model=TokenResponseDTO, summary="Login with username or email")
async def login(
    req: UserLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with username or email and password."""
    user = await AuthService.authenticate_user(db, req.login, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive.",
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    _set_auth_cookie(response, token)
    return TokenResponseDTO(
        access_token=token,
        token_type="bearer",
        user=UserResponseDTO.model_validate(user),
    )


@router.post("/logout", summary="Logout user")
async def logout(response: Response):
    """Log out user and clear session cookie."""
    _clear_auth_cookie(response)
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=UserResponseDTO, summary="Get current authenticated user")
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve profile of currently authenticated user."""
    return UserResponseDTO.model_validate(current_user)


@router.put("/profile", response_model=UserResponseDTO, summary="Update current user profile")
async def update_profile(
    req: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile details or password for currently authenticated user."""
    updated = await AuthService.update_profile(db, current_user, req)
    return UserResponseDTO.model_validate(updated)
