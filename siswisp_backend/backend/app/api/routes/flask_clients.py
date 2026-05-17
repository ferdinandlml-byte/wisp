"""
Rutas para gestión de clientes (Flask).
"""
from flask import Blueprint, request, jsonify
from functools import wraps
from app.core.database import SessionLocal
from app.core.security import get_current_user
from app.models import Client, ClientStatus

clients_bp = Blueprint('clients', __name__, url_prefix='/api/clients')


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


def serialize_client(client):
    """Serializar cliente a diccionario."""
    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "ip_address": client.ip_address,
        "status": client.status.value if client.status else "ACTIVE",
        "plan_id": client.plan_id,
        "billing_day": client.billing_day,
        "created_at": client.created_at.isoformat() if client.created_at else None,
    }


@clients_bp.route("/", methods=["GET"])
@token_required
def list_clients():
    """Listar todos los clientes con filtros opcionales."""
    status = request.args.get("status")
    search = request.args.get("search")
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 100))
    
    db = get_db()
    q = db.query(Client)
    
    if status:
        try:
            q = q.filter(Client.status == ClientStatus[status])
        except KeyError:
            return jsonify({"detail": f"Status inválido: {status}"}), 400
    
    if search:
        q = q.filter(Client.name.ilike(f"%{search}%"))
    
    clients = q.offset(skip).limit(limit).all()
    return jsonify([serialize_client(c) for c in clients]), 200


@clients_bp.route("/", methods=["POST"])
@token_required
def create_client():
    """Crear un nuevo cliente."""
    data = request.get_json()
    
    required = ["name", "email", "phone", "ip_address", "plan_id"]
    if not data or not all(k in data for k in required):
        return jsonify({"detail": f"Campos requeridos: {', '.join(required)}"}), 400
    
    db = get_db()
    client = Client(
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        ip_address=data.get("ip_address"),
        plan_id=data.get("plan_id"),
        billing_day=data.get("billing_day", 1),
        status=ClientStatus.ACTIVE,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return jsonify(serialize_client(client)), 201


@clients_bp.route("/<int:client_id>", methods=["GET"])
@token_required
def get_client(client_id):
    """Obtener un cliente específico."""
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        return jsonify({"detail": "Cliente no encontrado"}), 404
    
    return jsonify(serialize_client(client)), 200


@clients_bp.route("/<int:client_id>", methods=["PATCH", "PUT"])
@token_required
def update_client(client_id):
    """Actualizar un cliente."""
    data = request.get_json()
    if not data:
        return jsonify({"detail": "Datos requeridos"}), 400
    
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        return jsonify({"detail": "Cliente no encontrado"}), 404
    
    # Actualizar campos permitidos
    allowed_fields = ["name", "email", "phone", "ip_address", "plan_id", "billing_day"]
    for field in allowed_fields:
        if field in data:
            setattr(client, field, data[field])
    
    db.commit()
    db.refresh(client)
    
    return jsonify(serialize_client(client)), 200


@clients_bp.route("/<int:client_id>", methods=["DELETE"])
@token_required
def delete_client(client_id):
    """Eliminar un cliente."""
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        return jsonify({"detail": "Cliente no encontrado"}), 404
    
    db.delete(client)
    db.commit()
    
    return jsonify({"ok": True}), 200
