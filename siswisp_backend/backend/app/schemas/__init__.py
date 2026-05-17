from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models import ClientStatus, PaymentStatus


# ──────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# PLAN
# ──────────────────────────────────────────────
class PlanCreate(BaseModel):
    name: str
    speed_down: int
    speed_up: int
    price: float
    description: Optional[str] = None

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    speed_down: Optional[int] = None
    speed_up: Optional[int] = None
    price: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PlanOut(BaseModel):
    id: int
    name: str
    speed_down: int
    speed_up: int
    price: float
    description: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# CLIENTE
# ──────────────────────────────────────────────
class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    billing_day: int = 1
    plan_id: int
    notes: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    billing_day: Optional[int] = None
    plan_id: Optional[int] = None
    status: Optional[ClientStatus] = None
    notes: Optional[str] = None

class ClientOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    ip_address: Optional[str]
    status: ClientStatus
    billing_day: int
    plan: PlanOut
    created_at: datetime
    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# PAGO
# ──────────────────────────────────────────────
class PaymentCreate(BaseModel):
    client_id: int
    amount: float
    month: int
    year: int
    due_date: datetime
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    client_id: int
    amount: float
    month: int
    year: int
    due_date: datetime
    paid_at: Optional[datetime]
    status: PaymentStatus
    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_clients: int
    active_clients: int
    suspended_clients: int
    cancelled_clients: int
    pending_payments: int
    overdue_payments: int
    monthly_income: float
    pending_income: float
