"""
Rutas para pagos y dashboard (Flask).
"""
from flask import Blueprint, request, jsonify
from functools import wraps
from app.core.database import SessionLocal
from app.core.security import get_current_user
from app.models import Payment, PaymentStatus, Client, ClientStatus
from sqlalchemy import func, extract
from datetime import datetime, timedelta

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


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


def serialize_payment(payment):
    """Serializar pago a diccionario."""
    # Usar valores por defecto si end_month/end_year son NULL (registros antiguos)
    end_month = payment.end_month if payment.end_month is not None else payment.month
    end_year = payment.end_year if payment.end_year is not None else payment.year
    
    # Calcular cantidad de meses cubiertos
    if end_month >= payment.month and end_year == payment.year:
        # Mismo año: simple resta
        months_covered = end_month - payment.month + 1
    elif end_year > payment.year:
        # Cruza años: (12 - mes_inicio) + mes_fin + 1
        months_covered = (12 - payment.month + 1) + end_month
    else:
        months_covered = 1
    
    return {
        "id": payment.id,
        "client_id": payment.client_id,
        "amount": float(payment.amount),
        "month": payment.month,
        "end_month": end_month,
        "year": payment.year,
        "end_year": end_year,
        "months_covered": months_covered,
        "period": f"{payment.month}/{payment.year} - {end_month}/{end_year}",
        "due_date": payment.due_date.isoformat() if payment.due_date else None,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        "status": payment.status.value if payment.status else "PENDING",
    }


@payments_bp.route("/", methods=["GET"])
@token_required
def list_payments():
    """Listar pagos con filtros opcionales."""
    client_id = request.args.get("client_id", type=int)
    status = request.args.get("status")
    
    db = get_db()
    q = db.query(Payment)
    
    if client_id:
        q = q.filter(Payment.client_id == client_id)
    
    if status:
        try:
            q = q.filter(Payment.status == PaymentStatus[status])
        except KeyError:
            return jsonify({"detail": f"Status inválido: {status}"}), 400
    
    payments = q.order_by(Payment.due_date.desc()).limit(200).all()
    return jsonify([serialize_payment(p) for p in payments]), 200


def calculate_due_date(client_id, end_month, end_year):
    """Calcular fecha de vencimiento basada en día_cobro del cliente.
    
    Si el cliente paga hasta agosto (end_month=8), el vencimiento es 21 de septiembre
    (un día antes del próximo día de cobro).
    """
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client or not client.billing_day:
        # Sin cliente o sin día de cobro, no se puede calcular
        return None
    
    billing_day = client.billing_day
    
    # Próximo mes después del período
    next_month = end_month + 1
    next_year = end_year
    if next_month > 12:
        next_month = 1
        next_year += 1
    
    # Crear fecha del próximo día de cobro
    try:
        next_billing = datetime(next_year, next_month, billing_day)
    except ValueError:
        # Si el día no existe en ese mes (ej: 31 de febrero), usar último día del mes
        if next_month == 2:
            next_billing = datetime(next_year, 2, 28)
        elif next_month in [4, 6, 9, 11]:
            next_billing = datetime(next_year, next_month, 30)
        else:
            next_billing = datetime(next_year, next_month, 31)
    
    # Restar 1 día para obtener el vencimiento (día anterior al próximo cobro)
    due_date = next_billing - timedelta(days=1)
    
    return due_date


def calculate_payment_amount(client_id, month, end_month, year, end_year):
    """Calcular monto total basado en el plan mensual y cantidad de meses.
    
    Ejemplo: Plan $500/mes, pago de mayo a agosto (4 meses) = $2000
    """
    db = get_db()
    client = db.query(Client).filter(Client.id == client_id).first()
    
    if not client or not client.plan:
        return None
    
    plan_price = client.plan.price
    
    # Calcular cantidad de meses igual a serialize_payment()
    if end_month >= month and end_year == year:
        # Mismo año: simple resta
        months_covered = end_month - month + 1
    elif end_year > year:
        # Cruza años: (12 - mes_inicio) + mes_fin + 1
        months_covered = (12 - month + 1) + end_month
    else:
        months_covered = 1
    
    return plan_price * months_covered


@payments_bp.route("/", methods=["POST"])
@token_required
def create_payment():
    """Crear un nuevo pago (puede cubrir múltiples meses)."""
    data = request.get_json()
    
    required = ["client_id", "month", "year"]
    if not data or not all(k in data for k in required):
        return jsonify({"detail": f"Campos requeridos: {', '.join(required)}"}), 400
    
    # Si no viene due_date, intentar calcular automáticamente
    if "due_date" in data and data.get("due_date"):
        try:
            due_date_str = data.get("due_date")
            if 'T' in due_date_str:
                due_date = datetime.fromisoformat(due_date_str.split('.')[0])
            else:
                due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
        except (ValueError, TypeError, AttributeError):
            return jsonify({"detail": f"due_date inválido: {data.get('due_date')}. Use formato YYYY-MM-DD"}), 400
    else:
        # Calcular automáticamente
        end_month = data.get("end_month", data.get("month"))
        end_year = data.get("end_year", data.get("year"))
        due_date = calculate_due_date(data.get("client_id"), end_month, end_year)
    
    # Si no viene end_month, asumir que es un mes único
    end_month = data.get("end_month", data.get("month"))
    end_year = data.get("end_year", data.get("year"))
    
    # Validar que end_month >= month
    if end_year < data.get("year") or (end_year == data.get("year") and end_month < data.get("month")):
        return jsonify({"detail": "Mes final debe ser >= mes inicial"}), 400
    
    # Calcular amount automáticamente si no viene o es 0
    if "amount" not in data or not data.get("amount") or data.get("amount") == 0:
        calculated_amount = calculate_payment_amount(
            data.get("client_id"), 
            data.get("month"), 
            end_month, 
            data.get("year"), 
            end_year
        )
        if calculated_amount is not None:
            amount = calculated_amount
        else:
            return jsonify({"detail": "No se pudo calcular el monto automáticamente. Proporcione amount o verifique el cliente"}), 400
    else:
        amount = data.get("amount")
    
    db = get_db()
    payment = Payment(
        client_id=data.get("client_id"),
        amount=amount,
        month=data.get("month"),
        end_month=end_month,
        year=data.get("year"),
        end_year=end_year,
        due_date=due_date,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return jsonify(serialize_payment(payment)), 201


@payments_bp.route("/<int:payment_id>", methods=["PUT"])
@token_required
def update_payment(payment_id):
    """Editar un pago existente."""
    data = request.get_json()
    db = get_db()
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        return jsonify({"detail": "Pago no encontrado"}), 404
    
    try:
        # Track si cambiaron los campos que afectan el monto o vencimiento
        dates_changed = False
        
        # Actualizar campos si vienen en la request
        if "client_id" in data:
            payment.client_id = data["client_id"]
            dates_changed = True
        
        if "month" in data:
            payment.month = data["month"]
            dates_changed = True
        
        if "end_month" in data:
            payment.end_month = data["end_month"]
            dates_changed = True
        
        if "year" in data:
            payment.year = data["year"]
            dates_changed = True
        
        if "end_year" in data:
            payment.end_year = data["end_year"]
            dates_changed = True
        
        # Si se cambió end_month o end_year, recalcular due_date automáticamente
        if dates_changed and "due_date" not in data:
            calculated_due = calculate_due_date(payment.client_id, payment.end_month, payment.end_year)
            if calculated_due:
                payment.due_date = calculated_due
        
        # Calcular amount automáticamente si cambió el período o cliente Y user NO proporciona amount
        if dates_changed and ("amount" not in data or not data.get("amount") or data.get("amount") == 0):
            calculated_amount = calculate_payment_amount(
                payment.client_id,
                payment.month,
                payment.end_month,
                payment.year,
                payment.end_year
            )
            if calculated_amount is not None:
                payment.amount = calculated_amount
        elif "amount" in data and data.get("amount") and data.get("amount") != 0:
            payment.amount = data["amount"]
        
        if "due_date" in data:
            due_date_str = data["due_date"]
            if due_date_str:  # Solo si no es vacío
                if 'T' in due_date_str:
                    due_date = datetime.fromisoformat(due_date_str.split('.')[0])
                else:
                    due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
                payment.due_date = due_date
        
        if "status" in data:
            try:
                payment.status = PaymentStatus[data["status"]]
                if data["status"] == "PAID":
                    payment.paid_at = datetime.utcnow()
            except KeyError:
                return jsonify({"detail": f"Status inválido: {data['status']}"}), 400
        
        if "notes" in data:
            payment.notes = data["notes"]
        
        db.commit()
        db.refresh(payment)
        
        return jsonify(serialize_payment(payment)), 200
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": str(e)}), 500
@token_required
def mark_paid(payment_id):
    """Marcar un pago como pagado."""
    db = get_db()
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        return jsonify({"detail": "Pago no encontrado"}), 404
    
    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    
    return jsonify(serialize_payment(payment)), 200


@dashboard_bp.route("/stats", methods=["GET"])
@token_required
def get_stats():
    """Obtener estadísticas del dashboard."""
    db = get_db()
    now = datetime.utcnow()
    
    total = db.query(func.count(Client.id)).scalar() or 0
    active = db.query(func.count(Client.id)).filter(Client.status == ClientStatus.ACTIVE).scalar() or 0
    suspended = db.query(func.count(Client.id)).filter(Client.status == ClientStatus.SUSPENDED).scalar() or 0
    cancelled = db.query(func.count(Client.id)).filter(Client.status == ClientStatus.CANCELLED).scalar() or 0
    
    pending = db.query(func.count(Payment.id)).filter(Payment.status == PaymentStatus.PENDING).scalar() or 0
    overdue = db.query(func.count(Payment.id)).filter(Payment.status == PaymentStatus.OVERDUE).scalar() or 0
    
    monthly_income = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.status == PaymentStatus.PAID,
            extract("month", Payment.paid_at) == now.month,
            extract("year", Payment.paid_at) == now.year,
        )
        .scalar() or 0
    )
    pending_income = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.OVERDUE]))
        .scalar() or 0
    )
    
    return jsonify({
        "total_clients": int(total),
        "active_clients": int(active),
        "suspended_clients": int(suspended),
        "cancelled_clients": int(cancelled),
        "pending_payments": int(pending),
        "overdue_payments": int(overdue),
        "monthly_income": float(monthly_income),
        "pending_income": float(pending_income),
    }), 200
