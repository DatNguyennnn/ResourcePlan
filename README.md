# HR Resource Management - IBS Center

He thong quan ly phan bo nguon luc nhan su du an cho Trung tam IBS (iERP Services JSC).

## Tech Stack

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy
- **Frontend**: React 18 + Next.js 14 + TailwindCSS + Recharts
- **Database**: PostgreSQL 16
- **Auth**: JWT + bcrypt
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Deploy**: Docker Compose / Render.com

## Tinh nang

### Dang nhap & Phan quyen
- Dang nhap bang username/password (JWT token)
- 2 role: Admin (full CRUD) va Employee (chi xem)
- Default accounts: admin/admin123, employee/employee123
- Auth guard: tu dong redirect ve trang login neu chua dang nhap

### Dashboard
- Tong quan so luong nhan su, du an dang thuc hien
- Ty le tham gia du an (%)
- Canh bao nhan su qua tai (>100%) va chua du viec (<60%)
- Bieu do phan bo nhan su theo phong ban, level
- Bieu do trang thai du an
- Bieu do xu huong ty le tham gia theo tuan
- Banner canh bao overload (nhan vien >100% phan bo)

### Quan ly Nhan su (CRUD - Admin only)
- Them/sua/xoa nhan vien
- Loc theo phong ban, level, trang thai
- Tim kiem theo ten

### Quan ly Du an (CRUD - Admin only)
- Them/sua/xoa du an
- Loc theo trang thai, PM
- Tim kiem theo ten du an

### Bang phan bo nguon luc
- Hien thi bang phan bo nhan vien x tuan (heatmap)
- Click vao nhan vien de xem chi tiet phan bo theo tung du an
- Loc theo phong ban, tim kiem nhan vien
- Ma mau theo muc do phan bo (xanh 100%, vang 60-79%, cam 40-59%, do <40%)

### Phan bo nhan vien vao du an (Admin)
- Nut "Phan bo nhan vien" trong trang Bang phan bo
- Chon nhan vien, du an, ty le %, khoang thoi gian (tu ngay - den ngay)
- Tu dong tinh cac tuan (Monday) trong khoang va tao allocation
- Canh bao khi nhan vien da 100%+ truoc khi them (check real-time)
- Van cho phep luu du vuot 100% (chi canh bao, khong chan)

### Chinh sua % phan bo truc tiep (Admin)
- Click vao o % trong modal chi tiet nhan vien de chinh sua
- Nhap % moi, Enter de luu, Escape de huy
- Hien thi canh bao overload sau khi luu neu tong > 100%

### Import Excel
- Upload file Excel (dinh dang IBS_Resource Plan)
- Tu dong import nhan vien, du an va phan bo nguon luc

### Dark Mode
- Chuyen doi giao dien sang/toi
- Nut toggle trong Sidebar va trang Login
- Luu preference vao localStorage

### AI Chatbot
- Nut chat xanh duong goc phai duoi man hinh
- Hoi dap ve nhan su, du an, phan bo nguon luc
- Doc du lieu sau: chi tiet phan bo tung nhan vien (du an, % theo tuan), danh sach overload
- Vi du: "Co bao nhieu nhan vien o phong ban X?", "Ai dang ranh?", "Du an nao dang hoat dong?"

### Sidebar co the thu gon
- Nut dong/mo sidebar (collapse/expand)
- Nut dang xuat + doi giao dien sang/toi nam tren cung
- Tat ca label tieng Viet co dau: Tong quan, Nhan su, Du an, Bang phan bo, Nhap du lieu

### API
- RESTful API day du cho employees, projects, allocations
- API dashboard summary va resource table
- Bulk create/update allocations
- Loc va tim kiem tren tat ca endpoints
- Overload detection API

## Huong dan cai dat

### Yeu cau
- Docker va Docker Compose

### Chay ung dung

```bash
# Clone va di chuyen vao thu muc du an
cd HumanResource

# Khoi dong tat ca services
docker-compose up --build

# Truy cap ung dung
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Dang nhap

- **Admin**: username `admin`, password `admin123` (co quyen CRUD)
- **Nhan vien**: username `employee`, password `employee123` (chi xem)

### Import du lieu tu Excel

1. Dang nhap voi tai khoan admin
2. Truy cap http://localhost:3000/import
3. Upload file `IBS_Resource Plan_2026.xlsx`
4. He thong se tu dong tao nhan vien, du an va phan bo nguon luc

### Deploy len Render.com (mien phi)

1. Push code len GitHub
2. Vao [render.com](https://render.com), dang ky/dang nhap
3. Chon **New** > **Blueprint** > ket noi GitHub repo
4. Render se doc file `render.yaml` va tu dong tao:
   - PostgreSQL database (free)
   - Backend service (Docker)
   - Frontend service (Docker)
5. Sau khi deploy xong, cap nhat `CORS_ORIGINS` cua backend voi URL thuc te cua frontend
6. Truy cap URL frontend de su dung

### Chay development (khong Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
# Set DATABASE_URL trong .env
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Cau truc du an

```
HumanResource/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # FastAPI app entry point
│       ├── config.py          # Settings (JWT, DB)
│       ├── database.py        # SQLAlchemy setup
│       ├── auth.py            # JWT auth logic
│       ├── models/            # Database models
│       │   ├── employee.py
│       │   ├── project.py
│       │   ├── resource_allocation.py
│       │   └── user.py
│       ├── schemas/           # Pydantic schemas
│       │   ├── employee.py
│       │   ├── project.py
│       │   └── resource_allocation.py
│       └── api/               # API routes
│           ├── auth.py
│           ├── employees.py
│           ├── projects.py
│           ├── allocations.py
│           ├── dashboard.py
│           └── import_excel.py
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app/               # Next.js pages
│       │   ├── layout.tsx     # Root layout (Providers)
│       │   ├── providers.tsx  # Theme + Auth providers
│       │   ├── page.tsx       # Dashboard
│       │   ├── login/         # Trang dang nhap
│       │   ├── employees/     # Quan ly nhan su
│       │   ├── projects/      # Quan ly du an
│       │   ├── resource-table/# Bang phan bo
│       │   └── import/        # Import Excel
│       ├── components/        # React components
│       │   ├── Sidebar.tsx
│       │   ├── StatCard.tsx
│       │   ├── DashboardCharts.tsx
│       │   ├── ResourceTable.tsx
│       │   ├── EmployeeDetailModal.tsx
│       │   ├── OverloadWarning.tsx
│       │   ├── AllocationFormModal.tsx
│       │   └── Chatbot.tsx
│       └── lib/
│           ├── api.ts         # API client (axios + interceptor)
│           ├── auth.tsx       # AuthProvider context
│           └── theme.tsx      # ThemeProvider context
├── render.yaml                # Render.com deploy config
└── IBS_Resource Plan_2026.xlsx
```

## API Endpoints

| Method | Endpoint | Mo ta | Auth |
|--------|----------|-------|------|
| POST | /api/auth/login | Dang nhap (JWT) | Public |
| GET | /api/auth/me | Thong tin user | Login |
| POST | /api/auth/register | Dang ky user | Admin |
| POST | /api/auth/seed-admin | Tao tai khoan mac dinh | Public |
| GET | /api/employees/ | Danh sach nhan vien | Public |
| POST | /api/employees/ | Them nhan vien | Admin |
| PUT | /api/employees/{id} | Cap nhat nhan vien | Admin |
| DELETE | /api/employees/{id} | Xoa nhan vien | Admin |
| GET | /api/projects/ | Danh sach du an | Public |
| POST | /api/projects/ | Them du an | Admin |
| PUT | /api/projects/{id} | Cap nhat du an | Admin |
| DELETE | /api/projects/{id} | Xoa du an | Admin |
| GET | /api/allocations/ | Danh sach phan bo | Public |
| POST | /api/allocations/ | Them phan bo | Admin |
| GET | /api/allocations/overload | Nhan vien qua tai | Public |
| POST | /api/allocations/bulk | Them/cap nhat nhieu phan bo | Admin |
| GET | /api/dashboard/summary | Tong quan dashboard | Public |
| GET | /api/dashboard/resource-table | Bang phan bo nguon luc | Public |
| GET | /api/dashboard/employee-detail/{id} | Chi tiet phan bo nhan vien | Public |
| POST | /api/import/excel | Import du lieu tu Excel | Public |
