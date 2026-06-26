import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import settings


PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 210_000


def _derive_password_hash(password: str, salt: bytes, iterations: int) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return base64.b64encode(digest).decode("ascii")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    encoded_salt = base64.b64encode(salt).decode("ascii")
    encoded_hash = _derive_password_hash(password, salt, PASSWORD_HASH_ITERATIONS)
    return (
        f"{PASSWORD_HASH_ALGORITHM}"
        f"${PASSWORD_HASH_ITERATIONS}"
        f"${encoded_salt}"
        f"${encoded_hash}"
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        algorithm, iterations, encoded_salt, expected_hash = hashed_password.split("$", 3)
        if algorithm != PASSWORD_HASH_ALGORITHM:
            return False
        salt = base64.b64decode(encoded_salt.encode("ascii"))
        candidate_hash = _derive_password_hash(plain_password, salt, int(iterations))
    except (ValueError, TypeError):
        return False

    return hmac.compare_digest(candidate_hash, expected_hash)


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes,
    )
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
