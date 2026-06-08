from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.schemas.schemas import (
    CategoryResponse, CategoryCreate, BrandResponse, BrandCreate,
    ProductResponse, ProductCreate, ProductUpdate, ProductVariantResponse
)
from app.services import ProductService, AuditLogService
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User
from app.repositories import (
    category_repo, brand_repo, product_repo, product_variant_repo
)

router = APIRouter()

# ==========================================
# CATEGORIES ENDPOINTS
# ==========================================
@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return category_repo.get_multi(db, limit=100)

@router.post("/categories", response_model=CategoryResponse)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "WAREHOUSE_MANAGER"]))
):
    existing = db.query(category_repo.model).filter(category_repo.model.name == cat_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    new_cat = category_repo.create(db, obj_in=cat_in)
    AuditLogService.log(db, user_id=user.id, action="CREATE_CATEGORY", details=f"Created category {new_cat.name}")
    return new_cat

# ==========================================
# BRANDS ENDPOINTS
# ==========================================
@router.get("/brands", response_model=List[BrandResponse])
def list_brands(db: Session = Depends(get_db)):
    return brand_repo.get_multi(db, limit=100)

@router.post("/brands", response_model=BrandResponse)
def create_brand(
    brand_in: BrandCreate,
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "WAREHOUSE_MANAGER"]))
):
    existing = db.query(brand_repo.model).filter(brand_repo.model.name == brand_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Brand already exists")
        
    new_brand = brand_repo.create(db, obj_in=brand_in)
    AuditLogService.log(db, user_id=user.id, action="CREATE_BRAND", details=f"Created brand {new_brand.name}")
    return new_brand

# ==========================================
# PRODUCTS ENDPOINTS
# ==========================================
@router.get("/products", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    brand_id: Optional[int] = None
):
    products, _ = product_repo.get_with_filters(
        db, skip=skip, limit=limit, search=search, category_id=category_id, brand_id=brand_id
    )
    return products

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = product_repo.get(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/products", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "WAREHOUSE_MANAGER"]))
):
    return ProductService.create_product(db, product_in, user_id=user.id)

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN", "WAREHOUSE_MANAGER"]))
):
    db_product = product_repo.get(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = product_repo.update(db, db_obj=db_product, obj_in=product_in)
    AuditLogService.log(db, user_id=user.id, action="UPDATE_PRODUCT", details=f"Updated product ID {product_id}")
    return updated

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(RoleChecker(["ADMIN"]))
):
    db_product = product_repo.get(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product_repo.remove(db, id=product_id)
    AuditLogService.log(db, user_id=user.id, action="DELETE_PRODUCT", details=f"Deleted product {db_product.name}")
    return {"message": "Product and its variants deleted successfully"}

# ==========================================
# VARIANTS LOOKUP
# ==========================================
@router.get("/variants/sku/{sku}", response_model=ProductVariantResponse)
def get_variant_by_sku(sku: str, db: Session = Depends(get_db)):
    variant = product_variant_repo.get_by_sku(db, sku)
    if not variant:
        raise HTTPException(status_code=404, detail="Variant with this SKU not found")
    return variant

@router.get("/variants/barcode/{barcode}", response_model=ProductVariantResponse)
def get_variant_by_barcode(barcode: str, db: Session = Depends(get_db)):
    variant = product_variant_repo.get_by_barcode(db, barcode)
    if not variant:
        raise HTTPException(status_code=404, detail="Variant with this barcode not found")
    return variant
