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
    db = None
    try:
        print("[Devices API] GET /api/devices/ called")
        db = next(get_db())
        print("[Devices API] Database connection established")
        
        # Parámetros de paginación
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        
        if page < 1:
            page = 1
        
        print(f"[Devices API] Requesting page {page}, {per_page} items per page")
        
        # Contar total
        total = db.query(Device).count()
        print(f"[Devices API] Total devices in database: {total}")
        
        total_pages = (total + per_page - 1) // per_page
        
        # Obtener dispositivos
        devices = db.query(Device).order_by(desc(Device.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        print(f"[Devices API] Retrieved {len(devices)} devices for page {page}")
        
        # SIEMPRE devolver estructura correcta
        devices_list = []
        for d in devices:
            try:
                device_dict = {
                    "id": d.id,
                    "name": d.name or '',
                    "ip_address": d.ip_address or '',
                    "username": d.username or '',
                    "description": d.description or '',
                    "is_active": bool(d.is_active) if d.is_active is not None else True,
                    "created_at": d.created_at.isoformat() if d.created_at else None,
                    "updated_at": d.updated_at.isoformat() if d.updated_at else None,
                }
                devices_list.append(device_dict)
            except Exception as device_err:
                print(f"[Devices API] Error serializing device {d.id}: {str(device_err)}")
                continue
        
        response = {
            "devices": devices_list,
            "current_page": page,
            "total_pages": total_pages,
            "total": total,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
        print(f"[Devices API] Returning {len(devices_list)} devices, response structure valid")
        return jsonify(response), 200
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Devices API] ERROR: {str(e)}")
        print(f"[Devices API] TRACEBACK:\n{error_trace}")
        
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
    
    finally:
        if db:
            try:
                db.close()
            except:
                pass


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


# ──────────────────────────────────────────────
# DIAGNOSTIC - Verificar estado de la BD
# ──────────────────────────────────────────────
@devices_bp.route('/diagnostic/status', methods=['GET'])
def diagnostic_status():
    """Verificar que la tabla devices exista y tenga estructura correcta"""
    try:
        from sqlalchemy import inspect
        from app.core.database import engine
        
        inspector = inspect(engine)
        
        # Verificar si existe la tabla
        tables = inspector.get_table_names()
        devices_exists = 'devices' in tables
        
        if devices_exists:
            columns = {col['name']: col['type'] for col in inspector.get_columns('devices')}
            required_columns = ['id', 'name', 'ip_address', 'username', 'password', 'is_active', 'created_at', 'updated_at']
            missing_columns = [col for col in required_columns if col not in columns]
            
            db = next(get_db())
            device_count = db.query(Device).count()
            
            return jsonify({
                "status": "ok" if not missing_columns else "warning",
                "devices_table_exists": True,
                "device_count": device_count,
                "columns": columns,
                "missing_columns": missing_columns,
                "message": "Tabla devices está lista" if not missing_columns else f"Faltan columnas: {missing_columns}"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "devices_table_exists": False,
                "message": "La tabla devices no existe. Ejecutar: python init_db.py",
                "all_tables": tables
            }), 500
            
    except Exception as e:
        import traceback
        return jsonify({
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500
