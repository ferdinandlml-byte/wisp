"""
Rutas para gestión de clientes (Flask).
"""
from flask import Blueprint, request, jsonify, send_file
from functools import wraps
from app.core.database import SessionLocal
from app.core.security import get_current_user
from app.models import Client, ClientStatus, Plan
import csv
import io
import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

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
        "plan": {
            "id": client.plan.id,
            "name": client.plan.name,
            "speed_down": client.plan.speed_down,
            "speed_up": client.plan.speed_up,
            "price": client.plan.price,
        } if client.plan else None,
        "billing_day": client.billing_day,
        "created_at": client.created_at.isoformat() if client.created_at else None,
        "updated_at": client.updated_at.isoformat() if hasattr(client, 'updated_at') and client.updated_at else None,
    }


@clients_bp.route("/", methods=["GET"])
@token_required
def list_clients():
    """Listar todos los clientes con filtros opcionales y paginación."""
    status = request.args.get("status")
    search = request.args.get("search")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 100:
        per_page = 10
    
    skip = (page - 1) * per_page
    
    db = get_db()
    q = db.query(Client)
    
    if status:
        try:
            q = q.filter(Client.status == ClientStatus[status])
        except KeyError:
            return jsonify({"detail": f"Status inválido: {status}"}), 400
    
    if search:
        q = q.filter(Client.name.ilike(f"%{search}%"))
    
    total = q.count()
    clients = q.offset(skip).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    
    return jsonify({
        "data": [serialize_client(c) for c in clients],
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }), 200


@clients_bp.route("/", methods=["POST"])
@token_required
def create_client():
    """Crear un nuevo cliente."""
    data = request.get_json()
    
    # Validar campos obligatorios
    if not data or not data.get("name") or not data.get("plan_id"):
        return jsonify({"detail": "Campos requeridos: name, plan_id"}), 400
    
    db = get_db()
    client = Client(
        name=data.get("name"),
        email=data.get("email", ""),
        phone=data.get("phone", ""),
        ip_address=data.get("ip_address", ""),
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
    """Eliminar un cliente y sus pagos asociados."""
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        return jsonify({"detail": "Cliente no encontrado"}), 404
    
    try:
        # Importar Payment aquí para evitar circular imports
        from app.models import Payment
        
        # Primero eliminar todos los pagos asociados
        db.query(Payment).filter(Payment.client_id == client_id).delete()
        
        # Luego eliminar el cliente
        db.delete(client)
        db.commit()
        
        return jsonify({"ok": True}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Error al eliminar cliente: {str(e)}"}), 400


@clients_bp.route("/<int:client_id>/suspend", methods=["POST"])
@token_required
def suspend_client(client_id):
    """Suspender servicio de un cliente."""
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        return jsonify({"detail": "Cliente no encontrado"}), 404
    
    client.status = ClientStatus.SUSPENDED
    db.commit()
    db.refresh(client)
    
    return jsonify(serialize_client(client)), 200


@clients_bp.route("/<int:client_id>/reactivate", methods=["POST"])
@token_required
def reactivate_client(client_id):
    """Reactivar servicio de un cliente."""
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        return jsonify({"detail": "Cliente no encontrado"}), 404
    
    client.status = ClientStatus.ACTIVE
    db.commit()
    db.refresh(client)
    
    return jsonify(serialize_client(client)), 200


@clients_bp.route("/<int:client_id>/ping", methods=["GET"])
@token_required
def ping_client(client_id):
    """Verificar conectividad de un cliente (ping)."""
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client:
        return jsonify({"detail": "Cliente no encontrado"}), 404
    
    if not client.ip_address:
        return jsonify({"online": False, "message": "Sin IP configurada"}), 200
    
    # Simular ping (en producción, usar actual ping/ICMP)
    # Por ahora retornamos online si tiene IP
    try:
        # Intentar hacer ping real
        response = os.system(f"ping -c 1 {client.ip_address}" if os.name != 'nt' else f"ping -n 1 {client.ip_address}")
        online = response == 0
    except:
        # Fallback: asumir online si tiene IP
        online = True
    
    return jsonify({"online": online, "ip": client.ip_address}), 200


@clients_bp.route("/export/csv", methods=["GET"])
@token_required
def export_clients_csv():
    """Exportar lista de clientes a CSV."""
    db = get_db()
    clients = db.query(Client).all()
    
    # Crear CSV en memoria
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow(["ID", "Nombre", "Email", "Teléfono", "IP", "Plan", "Estado", "Día de Cobro", "Creado"])
    
    # Data
    for client in clients:
        writer.writerow([
            client.id,
            client.name,
            client.email,
            client.phone,
            client.ip_address,
            client.plan.name if client.plan else "N/A",
            client.status.value if client.status else "ACTIVE",
            client.billing_day,
            client.created_at.strftime("%Y-%m-%d") if client.created_at else ""
        ])
    
    # Convertir a bytes
    output.seek(0)
    stream = io.BytesIO(output.getvalue().encode('utf-8-sig'))
    stream.seek(0)
    
    return send_file(
        stream,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"clientes_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )


@clients_bp.route("/export/pdf", methods=["GET"])
@token_required
def export_clients_pdf():
    """Exportar lista de clientes a PDF (reporte)."""
    db = get_db()
    clients = db.query(Client).all()
    
    # Crear PDF en memoria
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1a3a52'),
        spaceAfter=20,
        alignment=1
    )
    
    # Contenido
    story = []
    
    # Título
    story.append(Paragraph("REPORTE DE CLIENTES - SISWISP", title_style))
    story.append(Paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Tabla de datos
    data = [["ID", "Nombre", "Email", "Teléfono", "Plan", "Estado", "Día Cobro"]]
    
    for client in clients:
        data.append([
            str(client.id),
            client.name[:20],
            client.email[:20] if client.email else "-",
            client.phone[:15] if client.phone else "-",
            client.plan.name if client.plan else "N/A",
            client.status.value if client.status else "ACTIVE",
            str(client.billing_day)
        ])
    
    # Crear tabla con estilos
    table = Table(data, colWidths=[0.6*inch, 1.2*inch, 1.2*inch, 1*inch, 1.2*inch, 1*inch, 0.8*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a3a52')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f0f0')])
    ]))
    
    story.append(table)
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph(f"Total de clientes: <b>{len(clients)}</b>", styles['Normal']))
    
    # Generar PDF
    doc.build(story)
    pdf_buffer.seek(0)
    
    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"clientes_reporte_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    )


@clients_bp.route("/import/csv", methods=["POST"])
@token_required
def import_clients_csv():
    """Importar clientes desde archivo CSV."""
    # Verificar archivo
    if 'file' not in request.files:
        return jsonify({"detail": "No se envió archivo"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"detail": "Archivo vacío"}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({"detail": "Solo se aceptan archivos CSV"}), 400
    
    try:
        # Leer CSV
        stream = io.StringIO(file.read().decode('utf-8'))
        reader = csv.DictReader(stream)
        
        db = get_db()
        imported = 0
        errors = []
        
        for row_num, row in enumerate(reader, start=2):  # Empezar en 2 (omitir header)
            try:
                # Validar campos requeridos
                name = row.get('Nombre', '').strip()
                plan_id_str = row.get('Plan ID', '').strip()
                
                if not name:
                    errors.append(f"Fila {row_num}: Falta nombre")
                    continue
                
                if not plan_id_str:
                    errors.append(f"Fila {row_num}: Falta Plan ID")
                    continue
                
                try:
                    plan_id = int(plan_id_str)
                except ValueError:
                    errors.append(f"Fila {row_num}: Plan ID inválido")
                    continue
                
                # Verificar que el plan existe
                plan = db.query(Plan).filter(Plan.id == plan_id).first()
                if not plan:
                    errors.append(f"Fila {row_num}: Plan con ID {plan_id} no existe")
                    continue
                
                # Crear cliente
                client = Client(
                    name=name,
                    email=row.get('Email', '').strip(),
                    phone=row.get('Teléfono', '').strip(),
                    ip_address=row.get('IP', '').strip(),
                    plan_id=plan_id,
                    billing_day=int(row.get('Día Cobro', 1)),
                    status=ClientStatus.ACTIVE,
                )
                
                db.add(client)
                imported += 1
                
            except Exception as e:
                errors.append(f"Fila {row_num}: {str(e)}")
        
        db.commit()
        
        return jsonify({
            "imported": imported,
            "errors": errors,
            "success": imported > 0
        }), 200 if imported > 0 else 400
        
    except Exception as e:
        return jsonify({"detail": f"Error al procesar CSV: {str(e)}"}), 400
