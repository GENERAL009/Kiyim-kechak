from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.schemas import (
    DashboardStatsResponse, AuditLogResponse
)
from app.services import ReportService, AuditLogService
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User
from app.repositories import (
    product_repo, inventory_repo, order_repo, transaction_repo, audit_log_repo
)

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Total Products
    total_products = db.query(product_repo.model).count()
    
    # Total Stock
    total_stock = inventory_repo.get_total_stock(db)
    
    # Low Stock Products count
    low_stock_items = inventory_repo.get_low_stock(db)
    low_stock_products = len(set([item.variant.product_id for item in low_stock_items if item.variant]))
    
    # Todays Sales
    todays_sales = order_repo.get_todays_sales(db)
    
    # Monthly Revenue
    monthly_revenue = order_repo.get_monthly_revenue(db)
    
    # Inventory Valuation
    inventory_value = inventory_repo.get_inventory_valuation(db)
    
    # Recent Transactions
    recent_transactions, _ = transaction_repo.get_history(db, limit=5)
    
    # Recent Orders
    recent_orders = order_repo.get_recent_orders(db, limit=5)
    
    return {
        "total_products": total_products,
        "total_stock": total_stock,
        "low_stock_products": low_stock_products,
        "todays_sales": todays_sales,
        "monthly_revenue": monthly_revenue,
        "inventory_value": inventory_value,
        "recent_transactions": recent_transactions,
        "recent_orders": recent_orders
    }

@router.get("/top-products")
def get_top_selling_products(
    db: Session = Depends(get_db),
    limit: int = 5,
    user: User = Depends(get_current_user)
):
    results = order_repo.get_top_selling_products(db, limit=limit)
    response_data = []
    for variant, qty, rev in results:
        response_data.append({
            "variant_id": variant.id,
            "sku": variant.sku,
            "size": variant.size,
            "color": variant.color,
            "price": variant.price,
            "product_name": variant.product.name if variant.product else "Noma'lum",
            "total_quantity": int(qty),
            "total_revenue": float(rev)
        })
    return response_data

@router.get("/export-excel")
def export_inventory_to_excel(
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "WAREHOUSE_MANAGER"]))
):
    excel_bytes = ReportService.generate_inventory_excel(db)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=inventory_report.xlsx"
        }
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(RoleChecker(["ADMIN"]))
):
    results, _ = audit_log_repo.get_logs(db, skip=skip, limit=limit)
    return results
