"""
Rutas para gestión de planes de servicio (Flask).
"""
from flask import Blueprint, request, jsonify
from functools import wraps
from app.core.database import SessionLocal
from app.core.security import get_current_user
from app.models import Plan

plans_bp = Blueprint('plans', __name__, url_prefix='/api/plans')


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


@plans_bp.route("/", methods=["POST"])
@token_required
def create_plan():
    """Crear un nuevo plan de servicio."""
    data = request.get_json()
    
    required = ["name", "speed_down", "speed_up", "price"]
    if not data or not all(k in data for k in required):
        return jsonify({"detail": f"Campos requeridos: {', '.join(required)}"}), 400
    
    db = get_db()
    plan = Plan(
        name=data.get("name"),
        speed_down=data.get("speed_down"),
        speed_up=data.get("speed_up"),
        price=data.get("price"),
        description=data.get("description", ""),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return jsonify({
        "id": plan.id,
        "name": plan.name,
        "speed_down": plan.speed_down,
        "speed_up": plan.speed_up,
        "price": plan.price,
        "description": plan.description,
        "is_active": plan.is_active,
    }), 201


@plans_bp.route("/", methods=["GET"])
@token_required
def list_plans():
    """Listar todos los planes de servicio."""
    db = get_db()
    plans = db.query(Plan).filter(Plan.is_active == True).all()
    
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "speed_down": p.speed_down,
        "speed_up": p.speed_up,
        "price": p.price,
        "description": p.description,
        "is_active": p.is_active,
    } for p in plans]), 200


@plans_bp.route("/<int:plan_id>", methods=["GET"])
@token_required
def get_plan(plan_id):
    """Obtener un plan específico."""
    db = get_db()
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    
    if not plan:
        return jsonify({"detail": "Plan no encontrado"}), 404
    
    return jsonify({
        "id": plan.id,
        "name": plan.name,
        "speed_down": plan.speed_down,
        "speed_up": plan.speed_up,
        "price": plan.price,
        "description": plan.description,
        "is_active": plan.is_active,
    }), 200
    
    plan.name = data.get("name", plan.name)
    plan.speed_down = data.get("speed_down", plan.speed_down)
    plan.speed_up = data.get("speed_up", plan.speed_up)
    plan.price = data.get("price", plan.price)
    plan.description = data.get("description", plan.description)
    
    db.commit()
    db.refresh(plan)
    
    return jsonify({
        "id": plan.id,
        "name": plan.name,
        "speed_down": plan.speed_down,
        "speed_up": plan.speed_up,
        "price": plan.price,
        "description": plan.description,
        "is_active": plan.is_active,
    }), 200


@plans_bp.route("/<int:plan_id>", methods=["DELETE"])
def delete_plan(plan_id):
    """Eliminar un plan de servicio."""
    db = get_db()
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    
    if not plan:
        return jsonify({"detail": "Plan no encontrado"}), 404
    
    db.delete(plan)
    db.commit()
    
    return jsonify({"message": "Plan eliminado correctamente"}), 200
