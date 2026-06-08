from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import time

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.models import Role, User, Category, Brand, Warehouse, Customer
from app.core.security import hash_password

# Import routers
from app.api import auth, products, warehouses, inventory, sales, reports, health

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("app.main")

# FastAPI App
app = FastAPI(
    title="Clothing Store WMS API",
    description="Professional Warehouse Management System for Clothing Stores",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Productionda cheklash kerak, local uchun yaroqli
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logger middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Duration: {duration:.4f}s")
    return response

# Mount uploaded files directory if needed
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Product Management"])
app.include_router(warehouses.router, prefix="/api/warehouses", tags=["Warehouse Management"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory Management"])
app.include_router(sales.router, prefix="/api/sales", tags=["Sales Management"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports & Analytics"])

# DB Seeding on Startup
@app.on_event("startup")
def startup_db_setup():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Roles
        roles = ["ADMIN", "WAREHOUSE_MANAGER", "SELLER"]
        db_roles = {}
        for role_name in roles:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=f"{role_name} roldagi foydalanuvchi")
                db.add(role)
                db.commit()
                db.refresh(role)
                logger.info(f"Role created: {role_name}")
            db_roles[role_name] = role

        # 2. Seed Admin User
        admin_email = settings.INITIAL_ADMIN_EMAIL
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin_role = db_roles["ADMIN"]
            admin = User(
                email=admin_email,
                hashed_password=hash_password(settings.INITIAL_ADMIN_PASSWORD),
                full_name="Bosh Adminstrator",
                role_id=admin_role.id,
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info(f"Initial Admin created: {admin_email}")

        # 3. Seed Default Categories & Brands if empty
        if db.query(Category).count() == 0:
            cats = [
                Category(name="Ko'ylaklar", description="Erkaklar va ayollar ko'ylaklari"),
                Category(name="Shimlar", description="Klassik va jinsi shimlar"),
                Category(name="Kurtkalar", description="Mavsumiy va qishki issiq kiyimlar"),
                Category(name="Futbolkalar", description="Yozgi yengil kiyimlar"),
            ]
            db.bulk_save_objects(cats)
            db.commit()
            logger.info("Default categories seeded")

        if db.query(Brand).count() == 0:
            brands = [
                Brand(name="Zara", description="Zara clothing brand"),
                Brand(name="Nike", description="Nike sportswear brand"),
                Brand(name="H&M", description="H&M brand"),
                Brand(name="Klass", description="Local premium brand"),
            ]
            db.bulk_save_objects(brands)
            db.commit()
            logger.info("Default brands seeded")

        # 4. Seed Default Warehouses if empty
        if db.query(Warehouse).count() == 0:
            warehouses = [
                Warehouse(name="Toshkent Asosiy Ombori", location="Toshkent shahri, Chilonzor tumani"),
                Warehouse(name="Samarqand filiali ombori", location="Samarqand shahri, Registon ko'chasi"),
            ]
            db.bulk_save_objects(warehouses)
            db.commit()
            logger.info("Default warehouses seeded")

        # 5. Seed Walk-in Customer
        walkin = db.query(Customer).filter(Customer.phone == "999999999").first()
        if not walkin:
            walkin = Customer(
                full_name="Walk-in Customer",
                phone="999999999",
                email="walkin@wms.com"
            )
            db.add(walkin)
            db.commit()
            logger.info("Default walk-in customer seeded")

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
        
    logger.info("Startup initialization complete.")
