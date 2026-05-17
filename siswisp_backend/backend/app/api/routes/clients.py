from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Client, ClientStatus
from app.schemas import ClientCreate, ClientUpdate, ClientOut
from app.services.mikrotik import suspend_client, reactivate_client, ping_client
from app.services.whatsapp import send_suspension_notice, send_reactivation_notice
import asyncio

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("/", response_model=List[ClientOut])
def list_clients(
    status: Optional[ClientStatus] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Client)
    if status:
        q = q.filter(Client.status == status)
    if search:
        q = q.filter(Client.name.ilike(f"%{search}%"))
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=ClientOut)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client


@router.patch("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(client)
    db.commit()
    return {"ok": True}


# ── Acciones MikroTik ──────────────────────────────────────────────────────────

@router.post("/{client_id}/suspend")
def suspend(client_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    result = suspend_client(client.ip_address, client.name)
    if result["success"]:
        client.status = ClientStatus.SUSPENDED
        db.commit()
        if client.phone:
            asyncio.run(send_suspension_notice(client.name, client.phone, client.plan.price))
    return result


@router.post("/{client_id}/reactivate")
def reactivate(client_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    result = reactivate_client(client.ip_address)
    if result["success"]:
        client.status = ClientStatus.ACTIVE
        db.commit()
        if client.phone:
            asyncio.run(send_reactivation_notice(client.name, client.phone))
    return result


@router.get("/{client_id}/ping")
def check_ping(client_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return ping_client(client.ip_address)
