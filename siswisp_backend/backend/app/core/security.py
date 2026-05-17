from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from app.core.config import settings
from app.core.database import SessionLocal
from app.models import User


def verify_password(plain: str, hashed: str) -> bool:
    """Verificar contraseña contra hash bcrypt"""
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def hash_password(password: str) -> str:
    """Hash de contraseña con bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crear JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decodificar JWT token"""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise Exception("Token expirado")
    except jwt.InvalidTokenError:
        raise Exception("Token inválido")


def get_current_user(token: str):
    """Obtener usuario actual desde token (para Flask)"""
    payload = decode_token(token)
    user_id: int = payload.get("sub")
    if not user_id:
        raise Exception("Token inválido")
    
    db = SessionLocal()
    user = db.query(User).filter(User.id == int(user_id)).first()
    db.close()
    
    if not user or not user.is_active:
        raise Exception("Usuario no encontrado o inactivo")
    
    return user
