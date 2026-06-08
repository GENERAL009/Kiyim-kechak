from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

# ==========================================
# AUTH SCHEMAS
# ==========================================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

# ==========================================
# ROLE SCHEMAS
# ==========================================
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# USER SCHEMAS
# ==========================================
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    role_id: int

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role_id: int
    role: RoleResponse
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# CATEGORY & BRAND SCHEMAS
# ==========================================
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BrandBase(BaseModel):
    name: str
    description: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class BrandResponse(BrandBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# PRODUCT VARIANT SCHEMAS
# ==========================================
class ProductVariantBase(BaseModel):
    sku: str
    barcode: str
    size: str
    color: str
    price: float = Field(..., ge=0.0)
    image_url: Optional[str] = None

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    image_url: Optional[str] = None

class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# PRODUCT SCHEMAS
# ==========================================
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: int
    brand_id: int

class ProductCreate(ProductBase):
    variants: List[ProductVariantCreate] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    category: CategoryResponse
    brand: BrandResponse
    variants: List[ProductVariantResponse] = []
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# WAREHOUSE SCHEMAS
# ==========================================
class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# INVENTORY SCHEMAS
# ==========================================
class InventoryBase(BaseModel):
    warehouse_id: int
    variant_id: int
    quantity: int = Field(..., ge=0)
    min_stock_level: int = Field(5, ge=0)

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)

class InventoryResponse(InventoryBase):
    id: int
    warehouse: WarehouseResponse
    variant: ProductVariantResponse
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# INVENTORY TRANSACTION SCHEMAS
# ==========================================
class InventoryTransactionCreate(BaseModel):
    transaction_type: str  # INCOMING, OUTGOING, TRANSFER, ADJUSTMENT
    variant_id: int
    quantity: int = Field(..., gt=0)
    from_warehouse_id: Optional[int] = None
    to_warehouse_id: Optional[int] = None
    remarks: Optional[str] = None

class InventoryTransactionResponse(BaseModel):
    id: int
    transaction_type: str
    variant_id: int
    quantity: int
    from_warehouse_id: Optional[int] = None
    to_warehouse_id: Optional[int] = None
    user_id: int
    remarks: Optional[str] = None
    created_at: datetime
    variant: ProductVariantResponse
    user: Optional[UserResponse] = None
    from_warehouse: Optional[WarehouseResponse] = None
    to_warehouse: Optional[WarehouseResponse] = None
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# CUSTOMER SCHEMAS
# ==========================================
class CustomerBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# ORDER SCHEMAS
# ==========================================
class OrderItemCreate(BaseModel):
    variant_id: int
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    id: int
    variant_id: int
    quantity: int
    unit_price: float
    variant: ProductVariantResponse
    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    customer_id: Optional[int] = None  # None bo'lsa yangi yoki anonim customer
    customer_name: Optional[str] = None  # Yangi customer yaratish uchun
    customer_phone: Optional[str] = None
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    seller_id: int
    total_amount: float
    status: str
    created_at: datetime
    customer: CustomerResponse
    seller: UserResponse
    items: List[OrderItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# AUDIT LOGS & REPORTS SCHEMAS
# ==========================================
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    details: Optional[str] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

class DashboardStatsResponse(BaseModel):
    total_products: int
    total_stock: int
    low_stock_products: int
    todays_sales: float
    monthly_revenue: float
    inventory_value: float
    recent_transactions: List[InventoryTransactionResponse]
    recent_orders: List[OrderResponse]
