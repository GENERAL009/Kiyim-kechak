from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.schemas import (
    OrderResponse, OrderCreate, CustomerResponse, CustomerCreate
)
from app.services import SalesService, ReportService, AuditLogService
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Order
from app.repositories import order_repo, customer_repo

router = APIRouter()

@router.post("/orders", response_model=OrderResponse)
def create_sale_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "SELLER", "WAREHOUSE_MANAGER"]))
):
    return SalesService.create_order(db, order_in, seller_id=user.id)

@router.get("/orders", response_model=List[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return order_repo.get_multi(db, limit=200)

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order_details(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    order = order_repo.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/orders/{order_id}/invoice")
def get_order_invoice_pdf(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    order = order_repo.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    pdf_bytes = ReportService.generate_sales_pdf(order)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=invoice_{order_id}.pdf"
        }
    )

@router.get("/customers", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return customer_repo.get_multi(db, limit=200)

@router.post("/customers", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "SELLER"]))
):
    existing = customer_repo.get_by_phone(db, customer_in.phone)
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this phone already exists")
        
    new_cust = customer_repo.create(db, obj_in=customer_in)
    AuditLogService.log(db, user_id=user.id, action="CREATE_CUSTOMER", details=f"Created customer {new_cust.full_name}")
    return new_cust
