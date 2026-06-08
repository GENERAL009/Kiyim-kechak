from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.schemas import WarehouseResponse, WarehouseCreate
from app.services import AuditLogService
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User
from app.repositories import warehouse_repo

router = APIRouter()

@router.get("/warehouses", response_model=List[WarehouseResponse])
def list_warehouses(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return warehouse_repo.get_multi(db, limit=100)

@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    warehouse = warehouse_repo.get(db, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse

@router.post("/warehouses", response_model=WarehouseResponse)
def create_warehouse(
    wh_in: WarehouseCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(RoleChecker(["ADMIN"]))
):
    existing = db.query(warehouse_repo.model).filter(warehouse_repo.model.name == wh_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse with this name already exists")
        
    new_wh = warehouse_repo.create(db, obj_in=wh_in)
    AuditLogService.log(db, user_id=admin.id, action="CREATE_WAREHOUSE", details=f"Created warehouse {new_wh.name}")
    return new_wh
