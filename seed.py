#!/usr/bin/env python3
"""
========================================================
  Kiyim-kechak WMS — Database Seeder / Faker Script
  Ishlatish: python seed.py
  Talab: DATABASE_URL environment variable yoki .env fayl
========================================================
"""

import os
import sys
import random
import string
from datetime import datetime, timedelta
from pathlib import Path

# .env fayldan o'qish
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip())

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://wms_user:wms_secure_pass_2026@postgres:5432/wms_db"
)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.core.database import Base
from app.models.models import (
    Role, User, Category, Brand, Product, ProductVariant,
    Warehouse, Inventory, InventoryTransaction,
    Customer, Order, OrderItem, AuditLog
)
from app.core.security import hash_password

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ══════════════════════════════════════════════════════
#  MA'LUMOTLAR
# ══════════════════════════════════════════════════════

CATEGORIES = [
    ("Erkaklar kiyimi", "Erkaklar uchun barcha turdagi kiyimlar"),
    ("Ayollar kiyimi", "Ayollar uchun barcha turdagi kiyimlar"),
    ("Bolalar kiyimi", "Bolalar uchun barcha turdagi kiyimlar"),
    ("Sport kiyimi", "Sport va faol dam olish uchun kiyimlar"),
    ("Kiyimlar aksessuarlari", "Kamarlar, shlyapalar va boshqa aksessuarlar"),
    ("Shimlar", "Barcha turdagi shimlar va brychlar"),
    ("Ko'ylaklar", "Formal va casual ko'ylaklar"),
    ("Kurtka va palto", "Qishki va bahorgi kurtka, palto, to'nlar"),
]

BRANDS = [
    ("Zara", "Ispaniya premium kiyim brendi"),
    ("H&M", "Shvediya arzon-narx kiyim brendi"),
    ("Nike", "Amerika sport kiyim brendi"),
    ("Adidas", "Germaniya sport kiyim brendi"),
    ("LC Waikiki", "Turk omma kiyim brendi"),
    ("Mango", "Ispaniya moda brendi"),
    ("Koton", "Turk kiyim brendi"),
    ("DeFacto", "Turk kiyim brendi"),
    ("Bershka", "Ispaniya yoshlar kiyim brendi"),
    ("Pull&Bear", "Ispaniya casual kiyim brendi"),
]

WAREHOUSES = [
    ("Toshkent Bosh Ombor", "Toshkent sh., Yunusobod tumani, Amir Temur ko'ch. 15"),
    ("Samarqand Ombori", "Samarqand sh., Registon ko'ch. 8"),
    ("Namangan Ombori", "Namangan sh., Navoi ko'ch. 22"),
    ("Andijon Ombori", "Andijon sh., Mustaqillik ko'ch. 5"),
    ("Buxoro Ombori", "Buxoro sh., Bahouddin Naqshband ko'ch. 3"),
]

PRODUCTS_DATA = [
    # (name, description, category_idx, brand_idx)
    ("Erkaklar klassik shimlar", "Premium paxta materialli biznes shim", 5, 0),
    ("Ayollar yozgi ko'ylak", "Yengil chit materiali, yozgi ko'ylak", 1, 5),
    ("Sport shorty", "Trenirovka uchun qulay shorty", 3, 2),
    ("Qishki kurtka erkaklar", "Issiq sintetik to'ldiruvchi, suv o'tkazmaydigan", 7, 3),
    ("Bolalar futbolka", "100% paxta, rang-barang naqshli", 2, 4),
    ("Ayollar jinsi shim", "Slim-fit ko'k jinsi shim", 5, 0),
    ("Erkaklar polo ko'ylak", "Klassik polo, 3 tugmali", 6, 6),
    ("Yosh qizlar ko'ylak", "Bayramona ko'ylak", 2, 7),
    ("Erkaklar sport kurtka", "Shox materiali, kapyushonli", 3, 3),
    ("Ayollar palto", "Bahorgi ingichka palto, pasteli rang", 7, 5),
    ("Erkaklar kashmir sviter", "Premium kashmir, qish uchun", 0, 1),
    ("Bolalar sport kiyim seti", "Futbolka va shim komplekti", 2, 2),
    ("Ayollar sport to'plam", "Yoga va fitness uchun", 3, 2),
    ("Erkaklar casual ko'ylak", "Zig-zag naqshli casual ko'ylak", 6, 8),
    ("Qiz bolalar leggings", "Elastik, raqs uchun", 2, 9),
    ("Erkaklar chino shim", "Beige chino, semi-formal", 5, 1),
    ("Ayollar blazer", "Ofis uchun klassik blazer", 1, 0),
    ("Bolalar paxta futbolka 3-pack", "Har xil rangda 3 ta futbolka", 2, 4),
    ("Erkaklar denim kurtka", "Klassik ko'k denim kurtka", 7, 6),
    ("Ayollar yubka", "A-line midi yubka", 1, 5),
    ("Sport brassiere", "Yuqori qo'llab-quvvatlash sport brassier", 3, 2),
    ("Erkaklar jogger shim", "Yumshoq paxta jogger", 3, 3),
    ("Ayollar ko'ylak-rubok", "Vertikal chiziqli ofis ko'ylak", 6, 7),
    ("Bolalar qishki jaket", "Issiq, suv o'tkazmaydigan, kapyushonli", 2, 3),
    ("Erkaklar linen ko'ylak", "Yoz uchun zig'ir (linen) ko'ylak", 6, 8),
]

SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
COLORS = [
    "Oq", "Qora", "Ko'k", "Yashil", "Qizil", "Sariq", "Jigarrang",
    "Kulrang", "Binafsha", "To'q sariq", "Och ko'k", "Pushti",
    "Beige", "Xaki", "Dengiz ko'ki"
]

CUSTOMERS = [
    ("Alibek Toshmatov", "+998901234567", "alibek@mail.uz"),
    ("Mohira Yusupova", "+998912345678", "mohira@gmail.com"),
    ("Jasur Rahimov", "+998901111222", None),
    ("Dilnoza Hasanova", "+998933334455", "dilnoza@mail.uz"),
    ("Sardor Mirzayev", "+998945556677", None),
    ("Gulnora Qodirov", "+998907778899", "gulnora@yahoo.com"),
    ("Bobur Ergashev", "+998919990011", None),
    ("Feruza Abdullayeva", "+998901122334", "feruza@gmail.com"),
    ("Ulugbek Normatov", "+998912233445", None),
    ("Zulfiya Karimova", "+998935566778", "zulfiya@mail.uz"),
    ("Sherzod Xoliqov", "+998901234001", None),
    ("Nargiza Sotvoldiyeva", "+998912234002", None),
    ("Kamol Tursunov", "+998934234003", "kamol@gmail.com"),
    ("Aziza Xo'jayeva", "+998907234004", "aziza@mail.uz"),
    ("Davron Ismoilov", "+998919234005", None),
    ("Barno Qosimova", "+998901234006", None),
    ("Temur Umarov", "+998912234007", "temur@inbox.uz"),
    ("Maftuna Nazarova", "+998934234008", None),
    ("Sanjar Haydarov", "+998907234009", None),
    ("Hilola Razzaqova", "+998919234010", "hilola@mail.uz"),
]

WAREHOUSE_MANAGERS = [
    ("Mansur Sharipov", "mansur@wms.com", "manager123"),
    ("Nodira Aliyeva", "nodira@wms.com", "manager123"),
]

SELLERS = [
    ("Zafar Qodirov", "zafar@wms.com", "seller123"),
    ("Laylo Toshpo'latova", "laylo@wms.com", "seller123"),
    ("Otabek Jurayev", "otabek@wms.com", "seller123"),
]


def random_sku(brand_name: str, product_id: int, variant_idx: int) -> str:
    prefix = brand_name[:3].upper().replace(" ", "").replace("&", "")
    return f"{prefix}-{product_id:04d}-{variant_idx:03d}"


def random_barcode() -> str:
    return "".join(random.choices(string.digits, k=13))


def random_price(base: float) -> float:
    return round(base * random.uniform(0.85, 1.15), 2)


def random_date_in_last_months(months: int = 6) -> datetime:
    days_back = random.randint(0, months * 30)
    return datetime.utcnow() - timedelta(days=days_back, hours=random.randint(0, 23))


# ══════════════════════════════════════════════════════
#  SEED FUNKSIYASI
# ══════════════════════════════════════════════════════

def seed():
    db = SessionLocal()
    try:
        print("🌱  WMS Seeder ishga tushdi...\n")

        # ── 1. ROLLAR ─────────────────────────────────────
        print("📋  Rollar yaratilmoqda...")
        roles = {}
        for role_name, desc in [
            ("ADMIN", "Tizim administratori — to'liq huquq"),
            ("WAREHOUSE_MANAGER", "Ombor menejeri — inventar boshqaruvi"),
            ("SELLER", "Sotuvchi — savdo va buyurtmalar"),
        ]:
            existing = db.query(Role).filter_by(name=role_name).first()
            if not existing:
                r = Role(name=role_name, description=desc)
                db.add(r)
                db.flush()
                roles[role_name] = r
            else:
                roles[role_name] = existing
        db.commit()
        print(f"   ✅  {len(roles)} rol tayyor\n")

        # ── 2. FOYDALANUVCHILAR ───────────────────────────
        print("👤  Foydalanuvchilar yaratilmoqda...")
        users_created = 0

        # Admin
        if not db.query(User).filter_by(email="admin@wms.com").first():
            db.add(User(
                email="admin@wms.com",
                hashed_password=hash_password("adminpassword"),
                full_name="Super Admin",
                role_id=roles["ADMIN"].id,
                is_active=True,
            ))
            users_created += 1

        # Warehouse Managers
        for full_name, email, pwd in WAREHOUSE_MANAGERS:
            if not db.query(User).filter_by(email=email).first():
                db.add(User(
                    email=email,
                    hashed_password=hash_password(pwd),
                    full_name=full_name,
                    role_id=roles["WAREHOUSE_MANAGER"].id,
                    is_active=True,
                ))
                users_created += 1

        # Sellers
        for full_name, email, pwd in SELLERS:
            if not db.query(User).filter_by(email=email).first():
                db.add(User(
                    email=email,
                    hashed_password=hash_password(pwd),
                    full_name=full_name,
                    role_id=roles["SELLER"].id,
                    is_active=True,
                ))
                users_created += 1

        db.commit()
        all_users = db.query(User).all()
        admin_user = db.query(User).filter_by(email="admin@wms.com").first()
        seller_users = db.query(User).join(Role).filter(Role.name == "SELLER").all()
        print(f"   ✅  {users_created} yangi foydalanuvchi yaratildi (jami: {len(all_users)})\n")

        # ── 3. KATEGORIYALAR ──────────────────────────────
        print("🗂️   Kategoriyalar yaratilmoqda...")
        category_objs = []
        for name, desc in CATEGORIES:
            existing = db.query(Category).filter_by(name=name).first()
            if not existing:
                c = Category(name=name, description=desc)
                db.add(c)
                db.flush()
                category_objs.append(c)
            else:
                category_objs.append(existing)
        db.commit()
        category_objs = db.query(Category).all()
        print(f"   ✅  {len(category_objs)} kategoriya tayyor\n")

        # ── 4. BRENDLAR ───────────────────────────────────
        print("🏷️   Brendlar yaratilmoqda...")
        brand_objs = []
        for name, desc in BRANDS:
            existing = db.query(Brand).filter_by(name=name).first()
            if not existing:
                b = Brand(name=name, description=desc)
                db.add(b)
                db.flush()
                brand_objs.append(b)
            else:
                brand_objs.append(existing)
        db.commit()
        brand_objs = db.query(Brand).all()
        print(f"   ✅  {len(brand_objs)} brend tayyor\n")

        # ── 5. OMBORLAR ───────────────────────────────────
        print("🏭  Omborlar yaratilmoqda...")
        warehouse_objs = []
        for name, loc in WAREHOUSES:
            existing = db.query(Warehouse).filter_by(name=name).first()
            if not existing:
                w = Warehouse(name=name, location=loc)
                db.add(w)
                db.flush()
                warehouse_objs.append(w)
            else:
                warehouse_objs.append(existing)
        db.commit()
        warehouse_objs = db.query(Warehouse).all()
        print(f"   ✅  {len(warehouse_objs)} ombor tayyor\n")

        # ── 6. MAHSULOTLAR VA VARIANTLAR ──────────────────
        print("👕  Mahsulotlar va variantlar yaratilmoqda...")
        all_variants = []
        products_created = 0
        variants_created = 0

        BASE_PRICES = {
            "Erkaklar": random.uniform(45, 120),
            "Ayollar": random.uniform(40, 110),
            "Bolalar": random.uniform(20, 65),
            "Sport": random.uniform(35, 95),
            "Ko'ylak": random.uniform(30, 90),
            "Shim": random.uniform(40, 100),
            "Kurtka": random.uniform(80, 200),
        }

        for idx, (p_name, p_desc, cat_idx, brand_idx) in enumerate(PRODUCTS_DATA):
            cat = category_objs[cat_idx % len(category_objs)]
            brand = brand_objs[brand_idx % len(brand_objs)]

            existing_prod = db.query(Product).filter_by(name=p_name).first()
            if existing_prod:
                all_variants.extend(existing_prod.variants)
                continue

            product = Product(
                name=p_name,
                description=p_desc,
                category_id=cat.id,
                brand_id=brand.id,
                created_at=random_date_in_last_months(12),
            )
            db.add(product)
            db.flush()
            products_created += 1

            # Base price
            base_price = 0
            for key, price in BASE_PRICES.items():
                if key in p_name:
                    base_price = price
                    break
            if base_price == 0:
                base_price = random.uniform(30, 150)

            # Har bir mahsulot uchun 3-6 variant (o'lcham + rang kombinatsiyasi)
            num_variants = random.randint(3, 6)
            chosen_sizes = random.sample(SIZES, min(num_variants, len(SIZES)))
            chosen_color = random.choice(COLORS)

            for v_idx, size in enumerate(chosen_sizes):
                color = chosen_color if v_idx == 0 else random.choice(COLORS)
                sku = random_sku(brand.name, product.id, v_idx)
                barcode = random_barcode()

                variant = ProductVariant(
                    product_id=product.id,
                    sku=sku,
                    barcode=barcode,
                    size=size,
                    color=color,
                    price=random_price(base_price),
                )
                db.add(variant)
                db.flush()
                all_variants.append(variant)
                variants_created += 1

        db.commit()
        all_variants = db.query(ProductVariant).all()
        print(f"   ✅  {products_created} mahsulot, {len(all_variants)} variant tayyor\n")

        # ── 7. INVENTAR (ZAXIRALAR) ────────────────────────
        print("📦  Omborlarga zaxiralar qo'shilmoqda...")
        inventory_created = 0

        for variant in all_variants:
            # Har bir variant 1-3 ta omborda bo'lishi mumkin
            selected_warehouses = random.sample(warehouse_objs, random.randint(1, min(3, len(warehouse_objs))))
            for wh in selected_warehouses:
                existing = db.query(Inventory).filter_by(
                    warehouse_id=wh.id, variant_id=variant.id
                ).first()
                if not existing:
                    qty = random.randint(0, 200)
                    inv = Inventory(
                        warehouse_id=wh.id,
                        variant_id=variant.id,
                        quantity=qty,
                        min_stock_level=random.choice([3, 5, 10, 15]),
                    )
                    db.add(inv)
                    inventory_created += 1

        db.commit()
        print(f"   ✅  {inventory_created} inventar yozuvi yaratildi\n")

        # ── 8. INVENTAR TRANZAKSIYALARI ───────────────────
        print("🔄  Inventar tranzaksiyalari yaratilmoqda...")
        tx_types = ["INCOMING", "OUTGOING", "TRANSFER", "ADJUSTMENT"]
        tx_weights = [50, 30, 15, 5]
        tx_created = 0

        for _ in range(150):
            variant = random.choice(all_variants)
            tx_type = random.choices(tx_types, weights=tx_weights)[0]
            qty = random.randint(1, 50)
            user = random.choice(all_users)
            from_wh = None
            to_wh = None

            if tx_type == "INCOMING":
                to_wh = random.choice(warehouse_objs)
            elif tx_type == "OUTGOING":
                from_wh = random.choice(warehouse_objs)
            elif tx_type == "TRANSFER":
                wh_pair = random.sample(warehouse_objs, 2)
                from_wh, to_wh = wh_pair[0], wh_pair[1]
            elif tx_type == "ADJUSTMENT":
                to_wh = random.choice(warehouse_objs)

            tx = InventoryTransaction(
                transaction_type=tx_type,
                variant_id=variant.id,
                quantity=qty,
                from_warehouse_id=from_wh.id if from_wh else None,
                to_warehouse_id=to_wh.id if to_wh else None,
                user_id=user.id,
                remarks=random.choice([
                    "Yangi kirim", "Mijozga sotildi", "Transferga yuborildi",
                    "Audit natijasi", "Inventarizatsiya", "Qaytarilgan tovar",
                    "Sezon boshlanganda kirim", None,
                ]),
                created_at=random_date_in_last_months(6),
            )
            db.add(tx)
            tx_created += 1

        db.commit()
        print(f"   ✅  {tx_created} tranzaksiya yaratildi\n")

        # ── 9. MIJOZLAR ───────────────────────────────────
        print("👥  Mijozlar yaratilmoqda...")
        customer_objs = []
        customers_created = 0
        for full_name, phone, email in CUSTOMERS:
            existing = db.query(Customer).filter_by(phone=phone).first()
            if not existing:
                c = Customer(
                    full_name=full_name,
                    phone=phone,
                    email=email,
                    created_at=random_date_in_last_months(12),
                )
                db.add(c)
                db.flush()
                customer_objs.append(c)
                customers_created += 1
            else:
                customer_objs.append(existing)
        db.commit()
        customer_objs = db.query(Customer).all()
        print(f"   ✅  {customers_created} yangi mijoz (jami: {len(customer_objs)})\n")

        # ── 10. BUYURTMALAR VA SAVDOLAR ───────────────────
        print("🛒  Buyurtmalar va savdolar yaratilmoqda...")
        orders_created = 0

        for _ in range(80):
            customer = random.choice(customer_objs)
            seller = random.choice(seller_users) if seller_users else admin_user
            order_date = random_date_in_last_months(6)
            status = random.choices(
                ["COMPLETED", "COMPLETED", "COMPLETED", "PENDING", "CANCELLED"],
                weights=[60, 20, 10, 7, 3]
            )[0]

            order = Order(
                customer_id=customer.id,
                seller_id=seller.id,
                total_amount=0.0,
                status=status,
                created_at=order_date,
            )
            db.add(order)
            db.flush()

            # Har bir buyurtmada 1-5 ta mahsulot
            total = 0.0
            num_items = random.randint(1, 5)
            chosen_variants = random.sample(all_variants, min(num_items, len(all_variants)))

            for variant in chosen_variants:
                qty = random.randint(1, 4)
                unit_price = variant.price
                item = OrderItem(
                    order_id=order.id,
                    variant_id=variant.id,
                    quantity=qty,
                    unit_price=unit_price,
                )
                db.add(item)
                total += qty * unit_price

            order.total_amount = round(total, 2)
            orders_created += 1

        db.commit()
        print(f"   ✅  {orders_created} buyurtma yaratildi\n")

        # ── 11. AUDIT LOGLARI ─────────────────────────────
        print("📝  Audit loglari yaratilmoqda...")
        audit_actions = [
            ("USER_LOGIN", "Tizimga kirish"),
            ("CREATE_ORDER", "Yangi buyurtma yaratildi"),
            ("STOCK_INCOMING", "Omborga tovar qabul qilindi"),
            ("STOCK_OUTGOING", "Ombordan tovar chiqarildi"),
            ("STOCK_ADJUST", "Inventar audit o'tkazildi"),
            ("CREATE_PRODUCT", "Yangi mahsulot qo'shildi"),
            ("UPDATE_PRODUCT", "Mahsulot ma'lumotlari yangilandi"),
            ("USER_LOGOUT", "Tizimdan chiqish"),
        ]
        logs_created = 0
        for _ in range(100):
            user = random.choice(all_users)
            action, details = random.choice(audit_actions)
            db.add(AuditLog(
                user_id=user.id,
                action=action,
                details=details,
                created_at=random_date_in_last_months(3),
            ))
            logs_created += 1

        db.commit()
        print(f"   ✅  {logs_created} audit log yaratildi\n")

        # ── YAKUNIY HISOBOT ───────────────────────────────
        print("=" * 55)
        print("🎉  SEEDING MUVAFFAQIYATLI YAKUNLANDI!")
        print("=" * 55)
        print(f"  Rollar          : {db.query(Role).count()}")
        print(f"  Foydalanuvchilar: {db.query(User).count()}")
        print(f"  Kategoriyalar   : {db.query(Category).count()}")
        print(f"  Brendlar        : {db.query(Brand).count()}")
        print(f"  Mahsulotlar     : {db.query(Product).count()}")
        print(f"  Variantlar      : {db.query(ProductVariant).count()}")
        print(f"  Omborlar        : {db.query(Warehouse).count()}")
        print(f"  Inventar yozuvlar: {db.query(Inventory).count()}")
        print(f"  Tranzaksiyalar  : {db.query(InventoryTransaction).count()}")
        print(f"  Mijozlar        : {db.query(Customer).count()}")
        print(f"  Buyurtmalar     : {db.query(Order).count()}")
        print(f"  Audit loglari   : {db.query(AuditLog).count()}")
        print("=" * 55)
        print("\n🔑  Login ma'lumotlari:")
        print("  Admin    → admin@wms.com        / adminpassword")
        print("  Manager1 → mansur@wms.com       / manager123")
        print("  Manager2 → nodira@wms.com       / manager123")
        print("  Seller1  → zafar@wms.com        / seller123")
        print("  Seller2  → laylo@wms.com        / seller123")
        print("  Seller3  → otabek@wms.com       / seller123")
        print("=" * 55)

    except Exception as e:
        db.rollback()
        print(f"\n❌  Xatolik yuz berdi: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
