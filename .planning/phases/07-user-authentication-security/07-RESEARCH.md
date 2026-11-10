# Phase 7: User Authentication & Security - Research

## 1. Password Hashing with Argon2id
- Argon2id is the winner of the Password Hashing Competition (PHC) and recommended by OWASP for password hashing.
- `argon2.PasswordHasher` from `argon2-cffi` provides safe defaults and clean verification:
  ```python
  from argon2 import PasswordHasher
  from argon2.exceptions import VerifyMismatchError

  ph = PasswordHasher()
  hashed = ph.hash(plain_password)
  # verify
  ph.verify(hashed, plain_password)
  ```
- If passwords require rehash (due to updated parameters), `ph.check_needs_rehash(hashed)` can be checked.

## 2. JWT Generation & Verification
- Signed using `pyjwt` with `algorithm="HS256"`.
- Payload:
  ```python
  {
      "sub": str(user.id),
      "email": user.email,
      "role": user.role.value,
      "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
      "iat": datetime.now(timezone.utc),
  }
  ```
- Fast token extraction dependency checks both `HTTPBearer` authorization header and HttpOnly cookie `access_token`.

## 3. Security Hardening
- Reject duplicate email or username with clear 400 Bad Request messages without revealing account existence on login failures (use generic "Invalid email/username or password").
- Constant-time verification prevents timing attacks.
