from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Payment, PaymentStatus, Client, ClientStatus
from app.schemas import PaymentCreate, PaymentOut, DashboardStats
from app.services.whatsapp import send_payment_confirmation
import asyncio

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/", response_model=List[PaymentOut])
def list_payments(
    client_id: int = None,
    status: PaymentStatus = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Payment)
    if client_id:
        q = q.filter(Payment.client_id == client_id)
    if status:
        q = q.filter(Payment.status == status)
    return q.order_by(Payment.due_date.desc()).limit(200).all()


@router.post("/", response_model=PaymentOut)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    payment = Payment(**data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/{payment_id}/mark-paid", response_model=PaymentOut)
def mark_paid(
    payment_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    # Notificar al cliente por WhatsApp
    client = payment.client
    if client.phone:
        month_name = datetime(payment.year, payment.month, 1).strftime("%B %Y")
        asyncio.run(
            send_payment_confirmation(client.name, client.phone, payment.amount, month_name)
        )
    return payment


# ── Dashboard ──────────────────────────────────────────────────────────────────

dashboard_router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@dashboard_router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    now = datetime.utcnow()

    total = db.query(func.count(Client.id)).scalar()
    active = db.query(func.count(Client.id)).filter(Client.status == ClientStatus.ACTIVE).scalar()
    suspended = db.query(func.count(Client.id)).filter(Client.status == ClientStatus.SUSPENDED).scalar()
    cancelled = db.query(func.count(Client.id)).filter(Client.status == ClientStatus.CANCELLED).scalar()

    pending = db.query(func.count(Payment.id)).filter(Payment.status == PaymentStatus.PENDING).scalar()
    overdue = db.query(func.count(Payment.id)).filter(Payment.status == PaymentStatus.OVERDUE).scalar()

    monthly_income = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.status == PaymentStatus.PAID,
            extract("month", Payment.paid_at) == now.month,
            extract("year", Payment.paid_at) == now.year,
        )
        .scalar()
    )
    pending_income = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.OVERDUE]))
        .scalar()
    )

    return DashboardStats(
        total_clients=total,
        active_clients=active,
        suspended_clients=suspended,
        cancelled_clients=cancelled,
        pending_payments=pending,
        overdue_payments=overdue,
        monthly_income=float(monthly_income),
        pending_income=float(pending_income),
    )
