# Clothing Store Warehouse Management System (WMS)

Kiyim-kechak do'koni uchun yaratilgan professional, enterprise darajasidagi Ombor Boshqaruv Tizimi (WMS). Loyiha backendda **FastAPI** (Python) va frontendda **React** (TypeScript, Vite, Tailwind CSS, Material UI) texnologiyalari yordamida, Clean Architecture arxitekturasida yozilgan.

## Texnologik Tuzilma

### Backend (FastAPI)
- **FastAPI**: Yuqori tezlikda ishlovchi RESTful API framework.
- **SQLAlchemy ORM**: Ma'lumotlar bazasi uchun ORM qatlami.
- **Alembic**: Ma'lumotlar bazasi migratsiyalari.
- **PostgreSQL**: Ishonchli, relyatsion ma'lumotlar bazasi.
- **Redis**: JWT tokenlarni keshlash va sessiyalarni boshqarish.
- **ReportLab**: PDF formatida sotuv cheklari (Invoice) generatsiyasi.
- **OpenPyxl**: Inventar qoldiqlarini Excel formatda eksport qilish.
- **Pytest**: API va Unit testlar.

### Frontend (React & TypeScript)
- **Vite**: Yuqori tezlikda yig'uvchi (bundler) vosita.
- **Tailwind CSS & Material UI**: Premium darajadagi dizayn, mikro-animatsiyalar va to'liq moslashuvchan (responsive) qorong'u/yorug' rejim (Dark/Light mode).
- **TanStack React Query**: Server holatini boshqarish va real-time zaxira monitoringi.
- **Axios**: API so'rovlarni jo'natish va avtomatik JWT interseptorlari.
- **Recharts**: Sotuvlar tahlili va zaxiralar ulushi uchun dinamik diagrammalar.

### DevOps & Nginx
- **Docker & Docker Compose**: Barcha 5 ta xizmatni konteynerlashtirish.
- **Nginx**: Kiruvchi so'rovlarni frontend va API o'rtasida to'g'ri taqsimlovchi Reverse Proxy.

---

## Loyiha Arxitekturasi (Clean Architecture)

Loyiha quyidagi qatlamlardan iborat:
1. **Models Layer**: Ma'lumotlar bazasi jadvallari modellari (`app/models`).
2. **Repository Layer**: DB operatsiyalarini ajratib turuvchi Repository Pattern (`app/repositories`).
3. **Service Layer**: Biznes logikalarni va PDF/Excel generatsiyalarini boshqarish (`app/services`).
4. **API Router Layer**: Kiruvchi HTTP so'rovlarni qabul qilish va validatsiya qilish (`app/api`).
5. **Security/Core**: JWT, parollar va sozlamalar (`app/core`).

---

## O'rnatish va Ishga Tushirish

Loyihani bitta buyruq yordamida Docker orqali ishga tushirishingiz mumkin:

```bash
docker compose up -d --build
```

Ushbu buyruq quyidagi xizmatlarni avtomatik sozlaydi va faollashtiradi:
- **PostgreSQL**: `localhost:5432` da ma'lumotlar bazasi.
- **Redis**: `localhost:6379` da kesh tizimi.
- **Backend**: `localhost:8000` da FastAPI API xizmati.
- **Frontend**: Vite orqali yig'ilgan static fayllar.
- **Nginx**: `localhost:80` da reverse proxy (barcha so'rovlar shu port orqali yo'naltiriladi).

### Kirish Ma'lumotlari (Initial Admin)

Tizim ishga tushganda ma'lumotlar bazasida default rollar, omborlar va quyidagi **Bosh Administrator** akkaunti avtomatik tarzda yaratiladi:
- **Email**: `admin@wms.com`
- **Parol**: `adminpassword`

Ushbu akkaunt orqali barcha bo'limlarni boshqarishingiz mumkin.

---

## Tizim Modullari va Foydalanuvchi Rollari

### Rollar
- **ADMIN**: Foydalanuvchilar, omborlar, mahsulotlar va barcha hisobotlarni to'liq boshqarish, audit loglarini ko'rish.
- **WAREHOUSE_MANAGER**: Omborga tovar qabul qilish (Kirim), omborlararo transfer, inventar sozlash (Audit/Adjustment) va tovar zaxiralarini boshqarish.
- **SELLER**: Zaxiralarni ko'rish, sotuv buyurtmalari yaratish (POS), mijozlarni boshqarish va chek (PDF) yuklash.

### Modullar
1. **Dashboard**: Barcha zaxiralar va sotuvlar to'g'risida asosiy ko'rsatkichlar (KPI) va chartlar.
2. **Mahsulotlar**: Tovar toifalari va brendlarini yaratish, tovarlarni o'lcham va rang variantlari bilan kiritish.
3. **Omborlar**: Jismoniy omborlarni qo'shish va ro'yxatlash.
4. **Inventar (Zaxira)**: Real-time qoldiqlar, kam qolgan tovar ogohlantirishlari, Kirim/Chiqim/Transfer tranzaksiyalari jurnali.
5. **Sotuv (POS)**: Shtrixkod va SKU orqali tovar qo'shib sotuv yaratish, chekni avtomatik PDF formatida chop etish.
6. **Hisobotlar**: Eng ko'p sotilgan tovarlar ro'yxati, inventarni Excel formatida eksport qilish, ADMIN uchun tizim audit loglarini ko'rish.

---

## Testlarni Ishga Tushirish

Backend xavfsizlik va xizmatlar testlarini quyidagi buyruq orqali ishga tushirishingiz mumkin:

```bash
docker compose exec backend pytest
```
