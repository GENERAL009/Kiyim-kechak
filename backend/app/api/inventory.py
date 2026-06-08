from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.schemas.schemas import (
    InventoryResponse, InventoryTransactionCreate, InventoryTransactionResponse
)
from app.services import InventoryService
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Inventory
from app.repositories import inventory_repo, transaction_repo

router = APIRouter()

@router.get("", response_model=List[InventoryResponse])
def get_inventory_stocks(
    db: Session = Depends(get_db),
    warehouse_id: Optional[int] = None,
    variant_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(get_current_user)
):
    query = db.query(Inventory)
    if warehouse_id:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    if variant_id:
        query = query.filter(Inventory.variant_id == variant_id)
        
    return query.offset(skip).limit(limit).all()

@router.post("/transaction", response_model=InventoryTransactionResponse)
def execute_stock_transaction(
    tx_in: InventoryTransactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "WAREHOUSE_MANAGER"]))
):
    tx_type = tx_in.transaction_type.upper()
    
    if tx_type == "INCOMING":
        return InventoryService.add_stock(db, tx_in, user_id=user.id)
    elif tx_type == "OUTGOING":
        return InventoryService.remove_stock(db, tx_in, user_id=user.id)
    elif tx_type == "TRANSFER":
        return InventoryService.transfer_stock(db, tx_in, user_id=user.id)
    elif tx_type == "ADJUSTMENT":
        return InventoryService.adjust_stock(db, tx_in, user_id=user.id)
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid transaction type. Must be INCOMING, OUTGOING, TRANSFER, or ADJUSTMENT."
        )

@router.get("/low-stock", response_model=List[InventoryResponse])
def get_low_stock_items(
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "WAREHOUSE_MANAGER"]))
):
    return inventory_repo.get_low_stock(db)

@router.get("/history", response_model=List[InventoryTransactionResponse])
def get_transaction_history(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    variant_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    user: User = Depends(RoleChecker(["ADMIN", "WAREHOUSE_MANAGER"]))
):
    results, _ = transaction_repo.get_history(
        db, skip=skip, limit=limit, variant_id=variant_id, warehouse_id=warehouse_id, transaction_type=transaction_type
    )
    return results
