"""
Tareas automáticas con Celery + Redis.
Se ejecutan en segundo plano para cobros, avisos y cortes.
"""
from celery import Celery
from celery.schedules import crontab
from datetime import datetime, date, timedelta
from app.core.config import settings

celery_app = Celery(
    "siswisp",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Mexico_City",
    enable_utc=True,
    beat_schedule={
        # Cada día a las 8am: enviar recordatorios 3 días antes
        "recordatorios-pago": {
            "task": "app.tasks.billing.send_payment_reminders",
            "schedule": crontab(hour=8, minute=0),
        },
        # Cada día a las 9am: suspender morosos
        "suspender-morosos": {
            "task": "app.tasks.billing.suspend_overdue_clients",
            "schedule": crontab(hour=9, minute=0),
        },
        # Primer día de cada mes: generar facturas del mes
        "generar-facturas": {
            "task": "app.tasks.billing.generate_monthly_invoices",
            "schedule": crontab(hour=7, minute=0, day_of_month=1),
        },
    },
)


@celery_app.task(name="app.tasks.billing.send_payment_reminders")
def send_payment_reminders():
    """
    Busca pagos que vencen en 3 días y envía WhatsApp a cada cliente.
    """
    import asyncio
    from app.core.database import SessionLocal
    from app.models import Payment, PaymentStatus, Client
    from app.services.whatsapp import send_payment_reminder

    db = SessionLocal()
    try:
        target_date = date.today() + timedelta(days=3)
        payments = (
            db.query(Payment)
            .join(Client)
            .filter(
                Payment.status == PaymentStatus.PENDING,
                Payment.due_date >= datetime.combine(target_date, datetime.min.time()),
                Payment.due_date < datetime.combine(target_date + timedelta(days=1), datetime.min.time()),
                Client.phone.isnot(None),
            )
            .all()
        )
        for p in payments:
            asyncio.run(
                send_payment_reminder(
                    client_name=p.client.name,
                    phone=p.client.phone,
                    amount=p.amount,
                    due_date=p.due_date.strftime("%d/%m/%Y"),
                )
            )
        return {"sent": len(payments)}
    finally:
        db.close()


@celery_app.task(name="app.tasks.billing.suspend_overdue_clients")
def suspend_overdue_clients():
    """
    Suspende clientes con pagos vencidos y les notifica por WhatsApp.
    """
    import asyncio
    from app.core.database import SessionLocal
    from app.models import Payment, PaymentStatus, Client, ClientStatus
    from app.services.mikrotik import suspend_client
    from app.services.whatsapp import send_suspension_notice

    db = SessionLocal()
    suspended = 0
    try:
        overdue = (
            db.query(Payment)
            .join(Client)
            .filter(
                Payment.status == PaymentStatus.PENDING,
                Payment.due_date < datetime.utcnow(),
                Client.status == ClientStatus.ACTIVE,
            )
            .all()
        )
        for p in overdue:
            # Marcar pago como vencido
            p.status = PaymentStatus.OVERDUE
            # Suspender en MikroTik
            if p.client.ip_address:
                suspend_client(p.client.ip_address, p.client.name)
            # Actualizar estado del cliente
            p.client.status = ClientStatus.SUSPENDED
            # Notificar por WhatsApp
            if p.client.phone:
                asyncio.run(
                    send_suspension_notice(p.client.name, p.client.phone, p.amount)
                )
            suspended += 1
        db.commit()
        return {"suspended": suspended}
    finally:
        db.close()


@celery_app.task(name="app.tasks.billing.generate_monthly_invoices")
def generate_monthly_invoices():
    """
    Genera facturas automáticas para todos los clientes activos al inicio del mes.
    """
    from app.core.database import SessionLocal
    from app.models import Client, Payment, ClientStatus
    from datetime import datetime

    db = SessionLocal()
    now = datetime.utcnow()
    generated = 0
    try:
        clients = (
            db.query(Client)
            .filter(Client.status == ClientStatus.ACTIVE)
            .all()
        )
        for client in clients:
            due = now.replace(day=client.billing_day)
            new_payment = Payment(
                client_id=client.id,
                amount=client.plan.price,
                month=now.month,
                year=now.year,
                due_date=due,
            )
            db.add(new_payment)
            generated += 1
        db.commit()
        return {"generated": generated}
    finally:
        db.close()
