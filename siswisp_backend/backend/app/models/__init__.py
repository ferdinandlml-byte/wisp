from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


# ──────────────────────────────────────────────
# ENUMS
# ──────────────────────────────────────────────
class ClientStatus(str, enum.Enum):
    ACTIVE = "activo"
    SUSPENDED = "suspendido"
    CANCELLED = "cancelado"


class PaymentStatus(str, enum.Enum):
    PENDING = "pendiente"
    PAID = "pagado"
    OVERDUE = "vencido"


# ──────────────────────────────────────────────
# USER (administradores del sistema)
# ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# PLAN DE SERVICIO
# ──────────────────────────────────────────────
class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)          # Ej: "Plan 10MB"
    speed_down = Column(Integer, nullable=False)         # Mbps bajada
    speed_up = Column(Integer, nullable=False)           # Mbps subida
    price = Column(Float, nullable=False)                # Precio mensual
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clients = relationship("Client", back_populates="plan")


# ──────────────────────────────────────────────
# CLIENTE
# ──────────────────────────────────────────────
class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)            # Para WhatsApp
    email = Column(String(150), nullable=True)
    address = Column(String(255), nullable=True)
    ip_address = Column(String(20), nullable=True)       # IP del router cliente
    mac_address = Column(String(20), nullable=True)
    router_id = Column(String(50), nullable=True)        # ID en MikroTik
    status = Column(SAEnum(ClientStatus), default=ClientStatus.ACTIVE)
    billing_day = Column(Integer, default=1)             # Día de cobro (1-28)
    notes = Column(Text, nullable=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    plan = relationship("Plan", back_populates="clients")
    payments = relationship("Payment", back_populates="client")


# ──────────────────────────────────────────────
# PAGO / FACTURA
# ──────────────────────────────────────────────
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    amount = Column(Float, nullable=False)
    month = Column(Integer, nullable=False)              # Mes facturado (1-12)
    year = Column(Integer, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", back_populates="payments")


# ──────────────────────────────────────────────
# DISPOSITIVO / SECTORIAL
# ──────────────────────────────────────────────
class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)           # Ej: "Sectorial 1"
    ip_address = Column(String(20), nullable=False, unique=True)
    username = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)       # Encriptada en producción
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
