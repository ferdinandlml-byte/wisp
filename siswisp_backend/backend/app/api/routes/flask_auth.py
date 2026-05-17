"""
Rutas de autenticación: login y registro (Flask).
"""
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import verify_password, hash_password, create_access_token, get_current_user
from app.models import User
from functools import wraps

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"detail": "Token inválido"}), 401
        
        if not token:
            return jsonify({"detail": "Token faltante"}), 401
        
        try:
            current_user = get_current_user(token)
            request.current_user = current_user
        except Exception as e:
            return jsonify({"detail": str(e)}), 401
        
        return f(*args, **kwargs)
    return decorated


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"detail": "Email y password son requeridos"}), 400
    
    db = get_db()
    user = db.query(User).filter(User.email == data.get("email")).first()
    
    if not user or not verify_password(data.get("password"), user.hashed_password):
        return jsonify({"detail": "Credenciales incorrectas"}), 401
    
    if not user.is_active:
        return jsonify({"detail": "Usuario desactivado"}), 403
    
    token = create_access_token({"sub": str(user.id)})
    return jsonify({"access_token": token}), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password") or not data.get("name"):
        return jsonify({"detail": "Nombre, email y password son requeridos"}), 400
    
    db = get_db()
    existing_user = db.query(User).filter(User.email == data.get("email")).first()
    
    if existing_user:
        return jsonify({"detail": "El correo ya está registrado"}), 400
    
    user = User(
        name=data.get("name"),
        email=data.get("email"),
        hashed_password=hash_password(data.get("password")),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
    }), 201


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    user = request.current_user
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
    }), 200
