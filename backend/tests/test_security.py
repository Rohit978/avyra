from datetime import timedelta
import pytest
from backend.app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_argon2id_password_hashing():
    raw_pwd = "SuperSecretPassword123!"
    hashed = hash_password(raw_pwd)

    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_access_token_creation_and_validation():
    data = {"sub": "test-uuid-1234", "role": "USER", "email": "test@example.com"}
    token = create_access_token(data, expires_delta=timedelta(minutes=30))

    assert isinstance(token, str)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "test-uuid-1234"
    assert payload["email"] == "test@example.com"
    assert payload["role"] == "USER"
    assert "exp" in payload


def test_jwt_invalid_or_expired_token():
    # Invalid token string
    assert decode_access_token("not.a.valid.jwt.token") is None

    # Expired token
    data = {"sub": "expired-user"}
    expired_token = create_access_token(data, expires_delta=timedelta(seconds=-10))
    assert decode_access_token(expired_token) is None
