"""
Rutas para gestión de planes de servicio.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Plan
from app.schemas import PlanCreate, PlanOut

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.post("/", response_model=PlanOut)
def create_plan(data: PlanCreate, db: Session = Depends(get_db)):
    """Crear un nuevo plan de servicio."""
    plan = Plan(
        name=data.name,
        speed_down=data.speed_down,
        speed_up=data.speed_up,
        price=data.price,
        description=data.description or "",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    """Listar todos los planes de servicio."""
    return db.query(Plan).all()


@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Obtener un plan específico."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    return plan


@router.put("/{plan_id}", response_model=PlanOut)
def update_plan(plan_id: int, data: PlanCreate, db: Session = Depends(get_db)):
    """Actualizar un plan de servicio."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    plan.name = data.name
    plan.speed_down = data.speed_down
    plan.speed_up = data.speed_up
    plan.price = data.price
    plan.description = data.description or ""
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """Eliminar un plan de servicio."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    db.delete(plan)
    db.commit()
    return {"message": "Plan eliminado correctamente"}
