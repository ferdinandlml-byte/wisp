from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from app.core.database import get_db
from app.models import Device

devices_bp = Blueprint('devices', __name__, url_prefix='/api/devices')


# ──────────────────────────────────────────────
# GET - Listar todos los dispositivos
# ──────────────────────────────────────────────
@devices_bp.route('/', methods=['GET'])
def list_devices():
    """Listar todos los dispositivos/sectoriales"""
    try:
        db = next(get_db())
        
        # Parámetros de paginación
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        
        if page < 1:
            page = 1
        
        # Contar total
        total = db.query(Device).count()
        total_pages = (total + per_page - 1) // per_page
        
        # Obtener dispositivos
        devices = db.query(Device).order_by(desc(Device.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        # SIEMPRE devolver estructura correcta
        response = {
            "devices": [
                {
                    "id": d.id,
                    "name": d.name,
                    "ip_address": d.ip_address,
                    "username": d.username,
                    "description": d.description or '',
                    "is_active": d.is_active,
                    "created_at": d.created_at.isoformat() if d.created_at else None,
                    "updated_at": d.updated_at.isoformat() if d.updated_at else None,
                }
                for d in devices
            ],
            "current_page": page,
            "total_pages": total_pages,
            "total": total,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
        print(f"[Devices API] Returning response: {response}")
        return jsonify(response), 200
    
    except Exception as e:
        print(f"[Devices API] Error: {str(e)}")
        # Devolver estructura aunque haya error
        return jsonify({
            "devices": [],
            "current_page": 1,
            "total_pages": 0,
            "total": 0,
            "has_next": False,
            "has_prev": False,
            "error": str(e)
        }), 500


# ──────────────────────────────────────────────
# GET - Obtener un dispositivo por ID
# ──────────────────────────────────────────────
@devices_bp.route('/<int:device_id>', methods=['GET'])
def get_device(device_id):
    """Obtener detalles de un dispositivo específico"""
    try:
        db = next(get_db())
        device = db.query(Device).filter(Device.id == device_id).first()
        
        if not device:
            return jsonify({"detail": "Dispositivo no encontrado"}), 404
        
        return jsonify({
            "id": device.id,
            "name": device.name,
            "ip_address": device.ip_address,
            "username": device.username,
            "password": device.password,
            "description": device.description,
            "is_active": device.is_active,
            "created_at": device.created_at.isoformat() if device.created_at else None,
            "updated_at": device.updated_at.isoformat() if device.updated_at else None,
        }), 200
    
    except Exception as e:
        return jsonify({"detail": str(e)}), 500


# ──────────────────────────────────────────────
# POST - Crear un nuevo dispositivo
# ──────────────────────────────────────────────
@devices_bp.route('/', methods=['POST'])
def create_device():
    """Crear un nuevo dispositivo/sectorial"""
    try:
        data = request.get_json()
        db = next(get_db())
        
        # Validar campos requeridos
        if not data.get('name'):
            return jsonify({"detail": "El nombre es requerido"}), 400
        
        if not data.get('ip_address'):
            return jsonify({"detail": "La dirección IP es requerida"}), 400
        
        if not data.get('username'):
            return jsonify({"detail": "El usuario es requerido"}), 400
        
        if not data.get('password'):
            return jsonify({"detail": "La contraseña es requerida"}), 400
        
        # Verificar que no exista una IP duplicada
        existing = db.query(Device).filter(Device.ip_address == data['ip_address']).first()
        if existing:
            return jsonify({"detail": f"Ya existe un dispositivo con la IP {data['ip_address']}"}), 400
        
        # Crear dispositivo
        device = Device(
            name=data['name'],
            ip_address=data['ip_address'],
            username=data['username'],
            password=data['password'],
            description=data.get('description', ''),
            is_active=data.get('is_active', True)
        )
        
        db.add(device)
        db.commit()
        db.refresh(device)
        
        return jsonify({
            "id": device.id,
            "name": device.name,
            "ip_address": device.ip_address,
            "username": device.username,
            "description": device.description,
            "is_active": device.is_active,
            "created_at": device.created_at.isoformat() if device.created_at else None,
        }), 201
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Error al crear dispositivo: {str(e)}"}), 500


# ──────────────────────────────────────────────
# PUT - Actualizar un dispositivo
# ──────────────────────────────────────────────
@devices_bp.route('/<int:device_id>', methods=['PUT'])
def update_device(device_id):
    """Actualizar un dispositivo existente"""
    try:
        db = next(get_db())
        device = db.query(Device).filter(Device.id == device_id).first()
        
        if not device:
            return jsonify({"detail": "Dispositivo no encontrado"}), 404
        
        data = request.get_json()
        
        # Validar IP única si se intenta cambiar
        if 'ip_address' in data and data['ip_address'] != device.ip_address:
            existing = db.query(Device).filter(
                Device.ip_address == data['ip_address']
            ).first()
            if existing:
                return jsonify({"detail": f"Ya existe un dispositivo con la IP {data['ip_address']}"}), 400
        
        # Actualizar campos
        if 'name' in data and data['name']:
            device.name = data['name']
        if 'ip_address' in data and data['ip_address']:
            device.ip_address = data['ip_address']
        if 'username' in data and data['username']:
            device.username = data['username']
        if 'password' in data and data['password']:
            device.password = data['password']
        if 'description' in data:
            device.description = data['description']
        if 'is_active' in data:
            device.is_active = data['is_active']
        
        db.commit()
        db.refresh(device)
        
        return jsonify({
            "id": device.id,
            "name": device.name,
            "ip_address": device.ip_address,
            "username": device.username,
            "description": device.description,
            "is_active": device.is_active,
            "updated_at": device.updated_at.isoformat() if device.updated_at else None,
        }), 200
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Error al actualizar dispositivo: {str(e)}"}), 500


# ──────────────────────────────────────────────
# DELETE - Eliminar un dispositivo
# ──────────────────────────────────────────────
@devices_bp.route('/<int:device_id>', methods=['DELETE'])
def delete_device(device_id):
    """Eliminar un dispositivo"""
    try:
        db = next(get_db())
        device = db.query(Device).filter(Device.id == device_id).first()
        
        if not device:
            return jsonify({"detail": "Dispositivo no encontrado"}), 404
        
        db.delete(device)
        db.commit()
        
        return jsonify({"message": "Dispositivo eliminado correctamente"}), 200
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Error al eliminar dispositivo: {str(e)}"}), 500
