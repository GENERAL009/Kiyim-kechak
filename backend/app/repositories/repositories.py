from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_
from typing import List, Optional, Tuple
from datetime import datetime

from app.repositories.base import CRUDBase
from app.models.models import (
    Role, User, Category, Brand, Product, ProductVariant,
    Warehouse, Inventory, InventoryTransaction, Customer, Order, OrderItem, AuditLog
)
from app.schemas.schemas import (
    RoleCreate, UserCreate, UserUpdate, CategoryCreate, BrandCreate,
    ProductCreate, ProductUpdate, WarehouseCreate, InventoryCreate, InventoryUpdate,
    InventoryTransactionCreate, CustomerCreate, OrderCreate
)

# ==========================================
# ROLE REPOSITORY
# ==========================================
class CRUDRole(CRUDBase[Role, RoleCreate, RoleCreate]):
    def get_by_name(self, db: Session, name: str) -> Optional[Role]:
        return db.query(self.model).filter(self.model.name == name).first()

role_repo = CRUDRole(Role)


# ==========================================
# USER REPOSITORY
# ==========================================
class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(self.model).filter(self.model.email == email).first()

user_repo = CRUDUser(User)


# ==========================================
# CATEGORY REPOSITORY
# ==========================================
class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryCreate]):
    pass

category_repo = CRUDCategory(Category)


# ==========================================
# BRAND REPOSITORY
# ==========================================
class CRUDBrand(CRUDBase[Brand, BrandCreate, BrandCreate]):
    pass

brand_repo = CRUDBrand(Brand)


# ==========================================
# PRODUCT REPOSITORY
# ==========================================
class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def get_with_filters(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        brand_id: Optional[int] = None
    ) -> Tuple[List[Product], int]:
        query = db.query(self.model)
        if category_id:
            query = query.filter(self.model.category_id == category_id)
        if brand_id:
            query = query.filter(self.model.brand_id == brand_id)
        if search:
            query = query.filter(
                or_(
                    self.model.name.ilike(f"%{search}%"),
                    self.model.description.ilike(f"%{search}%")
                )
            )
        total = query.count()
        results = query.offset(skip).limit(limit).all()
        return results, total

product_repo = CRUDProduct(Product)


# ==========================================
# PRODUCT VARIANT REPOSITORY
# ==========================================
class CRUDProductVariant(CRUDBase[ProductVariant, ProductVariantCreate, ProductVariantUpdate]):
    def get_by_sku(self, db: Session, sku: str) -> Optional[ProductVariant]:
        return db.query(self.model).filter(self.model.sku == sku).first()

    def get_by_barcode(self, db: Session, barcode: str) -> Optional[ProductVariant]:
        return db.query(self.model).filter(self.model.barcode == barcode).first()

product_variant_repo = CRUDProductVariant(ProductVariant)


# ==========================================
# WAREHOUSE REPOSITORY
# ==========================================
class CRUDWarehouse(CRUDBase[Warehouse, WarehouseCreate, WarehouseCreate]):
    pass

warehouse_repo = CRUDWarehouse(Warehouse)


# ==========================================
# INVENTORY REPOSITORY
# ==========================================
class CRUDInventory(CRUDBase[Inventory, InventoryCreate, InventoryUpdate]):
    def get_by_warehouse_and_variant(self, db: Session, warehouse_id: int, variant_id: int) -> Optional[Inventory]:
        return db.query(self.model).filter(
            and_(self.model.warehouse_id == warehouse_id, self.model.variant_id == variant_id)
        ).first()

    def get_low_stock(self, db: Session) -> List[Inventory]:
        return db.query(self.model).filter(self.model.quantity <= self.model.min_stock_level).all()

    def get_stock_by_variant(self, db: Session, variant_id: int) -> int:
        result = db.query(func.sum(self.model.quantity)).filter(self.model.variant_id == variant_id).scalar()
        return result or 0

    def get_total_stock(self, db: Session) -> int:
        result = db.query(func.sum(self.model.quantity)).scalar()
        return result or 0

    def get_inventory_valuation(self, db: Session) -> float:
        # SUM(inventory.quantity * product_variants.price)
        result = db.query(func.sum(self.model.quantity * ProductVariant.price)).join(
            ProductVariant, self.model.variant_id == ProductVariant.id
        ).scalar()
        return result or 0.0

inventory_repo = CRUDInventory(Inventory)


# ==========================================
# INVENTORY TRANSACTION REPOSITORY
# ==========================================
class CRUDInventoryTransaction(CRUDBase[InventoryTransaction, InventoryTransactionCreate, InventoryTransactionCreate]):
    def get_history(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        variant_id: Optional[int] = None,
        warehouse_id: Optional[int] = None,
        transaction_type: Optional[str] = None
    ) -> Tuple[List[InventoryTransaction], int]:
        query = db.query(self.model)
        if variant_id:
            query = query.filter(self.model.variant_id == variant_id)
        if warehouse_id:
            query = query.filter(
                or_(
                    self.model.from_warehouse_id == warehouse_id,
                    self.model.to_warehouse_id == warehouse_id
                )
            )
        if transaction_type:
            query = query.filter(self.model.transaction_type == transaction_type)
        
        # Sort by creation time (newest first)
        query = query.order_by(self.model.created_at.desc())
        total = query.count()
        results = query.offset(skip).limit(limit).all()
        return results, total

transaction_repo = CRUDInventoryTransaction(InventoryTransaction)


# ==========================================
# CUSTOMER REPOSITORY
# ==========================================
class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerCreate]):
    def get_by_phone(self, db: Session, phone: str) -> Optional[Customer]:
        return db.query(self.model).filter(self.model.phone == phone).first()

customer_repo = CRUDCustomer(Customer)


# ==========================================
# ORDER REPOSITORY
# ==========================================
class CRUDOrder(CRUDBase[Order, OrderCreate, OrderCreate]):
    def get_todays_sales(self, db: Session) -> float:
        today = datetime.utcnow().date()
        result = db.query(func.sum(self.model.total_amount)).filter(
            func.date(self.model.created_at) == today,
            self.model.status == "COMPLETED"
        ).scalar()
        return result or 0.0

    def get_monthly_revenue(self, db: Session) -> float:
        first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = db.query(func.sum(self.model.total_amount)).filter(
            self.model.created_at >= first_day_of_month,
            self.model.status == "COMPLETED"
        ).scalar()
        return result or 0.0

    def get_recent_orders(self, db: Session, limit: int = 5) -> List[Order]:
        return db.query(self.model).order_by(self.model.created_at.desc()).limit(limit).all()

    def get_top_selling_products(self, db: Session, limit: int = 5) -> List[Tuple[ProductVariant, int, float]]:
        # Returns: (variant, total_quantity, total_revenue)
        query = db.query(
            ProductVariant,
            func.sum(OrderItem.quantity).label("total_qty"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("total_rev")
        ).join(OrderItem, OrderItem.variant_id == ProductVariant.id)\
         .join(Order, OrderItem.order_id == Order.id)\
         .filter(Order.status == "COMPLETED")\
         .group_by(ProductVariant.id)\
         .order_by(func.sum(OrderItem.quantity).desc())\
         .limit(limit)
        return query.all()

order_repo = CRUDOrder(Order)


# ==========================================
# AUDIT LOG REPOSITORY
# ==========================================
class CRUDAuditLog(CRUDBase[AuditLog, AuditLogResponse, AuditLogResponse]):
    def get_logs(self, db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[AuditLog], int]:
        query = db.query(self.model).order_by(self.model.created_at.desc())
        total = query.count()
        results = query.offset(skip).limit(limit).all()
        return results, total

audit_log_repo = CRUDAuditLog(AuditLog)
