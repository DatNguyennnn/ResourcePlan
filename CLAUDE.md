# CLAUDE.md - Du an Quan ly Nguon luc Nhan su IBS

## Tong quan
Du an web app quan ly phan bo nguon luc nhan su du an cho Trung tam IBS (iERP Services JSC).
Xay dung dua tren du lieu tu file Excel `IBS_Resource Plan_2026.xlsx`.

## Tech Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React 18, Next.js 14 (App Router), TailwindCSS, Recharts, Lucide Icons
- **Database**: PostgreSQL 16
- **Deploy**: Docker Compose (3 services: db, backend, frontend)
- **Auth**: JWT (python-jose), bcrypt (passlib)
- **AI Chatbot**: Groq API (llama-3.3-70b-versatile)

## Lich su thay doi

### 2026-03-16 - Khoi tao du an
- Tao cau truc du an backend + frontend + docker
- **Backend**:
  - Models: Employee, Project, ResourceAllocation (SQLAlchemy)
  - Schemas: Pydantic validation cho moi model
  - API routes: CRUD employees, projects, allocations
  - Dashboard API: summary (KPI, charts data), resource-table (heatmap data), employee-detail
  - Import Excel API: doc file .xlsx va import du lieu tu 3 sheet (DS Nhan vien, DS Du an, Resource Plan)
- **Frontend**:
  - Dashboard page: 5 KPI cards, 4 bieu do (pie charts, bar chart, line chart), bang phan bo nguon luc
  - Employees page: CRUD voi form modal, bo loc (phong ban, level, trang thai), tim kiem
  - Projects page: CRUD voi form modal, bo loc (trang thai), tim kiem
  - Resource Table page: bang heatmap phan bo, modal chi tiet nhan vien, bo loc
  - Import page: upload file Excel, hien thi ket qua import
  - Components: Sidebar, StatCard, DashboardCharts, ResourceTable, EmployeeDetailModal
- **Docker**: docker-compose.yml voi 3 services (postgres, backend, frontend)
- **Documentation**: README.md voi huong dan cai dat va su dung

### 2026-03-16 - Deploy va test
- Fix Dockerfile frontend: xoa `2>/dev/null || true` trong COPY (Docker khong ho tro shell syntax), tao thu muc `public/`
- Fix import Excel: sheet name Vietnamese Unicode (NFC vs NFD) khong match -> them ham `find_sheet()` dung `unicodedata.normalize("NFC")` de so sanh
- Deploy thanh cong len Docker (3 containers: hr_postgres, hr_backend, hr_frontend)
- Test ket qua import: 26 employees, 44 projects, 1450 allocations
- Test CRUD employees: CREATE, UPDATE, DELETE deu OK (status 201, 200, 204)
- Test dashboard API: summary, resource-table, employee-detail deu tra du lieu chinh xac
- Test frontend: tat ca 5 trang deu tra HTTP 200 (/, /employees, /projects, /resource-table, /import)

### 2026-03-17 - Them tinh nang Auth, Dark Mode, Overload Warning, Chatbot
- **Authentication & Authorization**:
  - Backend: User model (username, hashed_password, full_name, role), JWT token auth
  - `backend/app/auth.py`: hash_password, verify_password, create_access_token, get_current_user, require_admin, require_login
  - `backend/app/api/auth.py`: POST /api/auth/login, GET /api/auth/me, POST /api/auth/register (admin only), GET /api/auth/users (admin only), POST /api/auth/seed-admin
  - Backend CRUD endpoints (employees, projects, allocations) protected: GET = public, POST/PUT/DELETE = admin only
  - Frontend: AuthProvider context (`frontend/src/lib/auth.tsx`), axios interceptor tu dong them JWT token
  - Trang login (`frontend/src/app/login/page.tsx`) voi demo credentials (admin/admin123, employee/employee123)
  - Auth guard tren tat ca trang: redirect ve /login neu chua dang nhap
  - Admin: thay nut CRUD (Them, Sua, Xoa). Employee: chi xem
  - Sidebar hien thi thong tin user (ten, role, nut dang xuat)
- **Overload Warning**:
  - `backend/app/api/allocations.py`: them GET /api/allocations/overload, POST/PUT tra warning khi employee >100%
  - `frontend/src/components/OverloadWarning.tsx`: banner canh bao nhan vien qua tai, hien thi chi tiet du an
- **Dark Mode**:
  - ThemeProvider context (`frontend/src/lib/theme.tsx`), luu localStorage, toggle class 'dark' tren html
  - `frontend/tailwind.config.ts`: darkMode: 'class'
  - Tat ca pages va components da duoc cap nhat voi dark mode classes
  - Nut chuyen dark/light mode trong Sidebar va trang Login
- **AI Chatbot**:
  - `frontend/src/components/Chatbot.tsx`: floating button goc phai duoi, cua so chat
  - Su dung Groq API (llama-3.3-70b-versatile) de tra loi cau hoi ve nhan su
  - Tu dong lay du lieu real-time tu dashboard, employees, projects, resource-table lam context
  - Chatbot hien thi tren tat ca trang (Dashboard, Employees, Projects, Resource Table, Import)

### 2026-03-17 - Them tinh nang phan bo nhan vien
- **Allocation Form Modal** (`frontend/src/components/AllocationFormModal.tsx`):
  - Admin co the phan bo nhan vien vao du an tu trang Bang phan bo
  - Chon nhan vien, du an, ty le %, khoang thoi gian (tu ngay - den ngay)
  - Tu dong tinh cac tuan (Monday) trong khoang thoi gian va tao allocation cho moi tuan
  - Hien thi canh bao khi nhan vien dang 100%+ truoc khi them (check real-time)
  - Sau khi luu, hien thi canh bao overload tu server neu vuot 100%
  - Van cho phep luu du vuot 100% (chi canh bao, khong chan)
- Them `bulkCreateAllocation` API function trong `frontend/src/lib/api.ts`
- Cap nhat `frontend/src/app/resource-table/page.tsx`: them nut "Phan bo nhan vien" cho admin, reload data sau khi phan bo
- **Inline Edit Allocation** trong `EmployeeDetailModal`:
  - Admin click vao o % trong chi tiet nhan vien de chinh sua truc tiep
  - Nhap % moi, Enter de luu, Escape de huy
  - Hien thi canh bao overload sau khi luu neu tong > 100%
  - Tu dong reload data sau khi chinh sua
  - Backend `employee-detail` API them tra ve `project_id` de frontend biet update dung du an
- **Chatbot doc sau hon**:
  - Fetch chi tiet phan bo tung nhan vien (tung du an, % theo tuan)
  - Fetch danh sach overload chi tiet (du an cu the, % cu the)
  - Cung cap du lieu allocation summary (TB/Max/Min %) cho moi nhan vien
  - Tang max_tokens len 2048, system prompt chi tiet hon

### 2026-03-17 - UI/UX va Deploy
- **Sidebar**:
  - Them nut dong/mo (collapse) sidebar
  - Chuyen nut dang xuat + doi giao dien sang/toi len tren cung (icon buttons)
  - Doi tat ca label sang tieng Viet co dau (Tong quan, Nhan su, Du an, Bang phan bo, Nhap du lieu)
- **Chatbot**: doi mau nut tu xanh la sang xanh duong de de phan biet
- **Vietnamese**: tat ca header, button, label, placeholder da doi sang tieng Viet co dau day du
- **Deploy**: them `render.yaml` cho deploy len Render.com (free tier)
  - PostgreSQL free database
  - Backend + Frontend web services
  - Dockerfile update: backend bo --reload, frontend dung ARG cho NEXT_PUBLIC_API_URL

### 2026-03-17 - Fix bugs va UI improvements
- **Fix Nhan su >100% sai**: backend tinh tong allocation trong +-7 ngay (2 tuan) gay cong don sai -> sua lai chi tinh dung tuan hien tai (`week_start == current_week_start`)
- **Sidebar nut to hon**: nut Dang xuat va Doi giao dien chuyen xuong duoi, them text label ("Dang xuat", "Giao dien sang/toi"), kich thuoc lon hon de nguoi dung de nhin
- **Mo rong date range**: employee-detail va resource-table API mo rong tu 16 tuan thanh ca nam (1/1 - 31/12), cho phep xem phan bo thang 12+
- **Docker Compose**: them build args de truyen NEXT_PUBLIC_API_URL khi build local
- **AI Chatbot proxy**: chuyen tu goi truc tiep Groq API o frontend sang goi qua backend proxy `/api/chat/` de bao mat API key
  - Them `backend/app/api/chat.py`: proxy endpoint goi Groq API voi key tu server-side env var
  - Them `GROQ_API_KEY` vao `backend/app/config.py`
  - Them `httpx` vao backend requirements
  - Frontend Chatbot.tsx goi `${API_URL}/api/chat/` thay vi truc tiep Groq
  - Fix loi chatbot ko hoat dong tren Render (API key ko co luc Docker build)

### 2026-03-17 - UI/UX improvements (UI Pro Max skill)
- **EmployeeDetailModal cai thien**:
  - Tat ca text chuyen sang tieng Viet co dau (Du an -> Du an, Tong -> Tong, warning messages)
  - Them nut Save/Cancel khi edit % (truoc chi co input, gio co nut xanh/xam)
  - Them success feedback ("Da cap nhat thanh X%") tu dong an sau 2.5s
  - Backdrop blur + shadow cho modal, gradient header
  - Loading spinner thay vi text "Dang tai..."
  - Skip save khi gia tri khong thay doi
- **Chatbot cai thien**:
  - Cache context 2 phut de giam API calls
  - Giam context size: bo chi tiet phan bo tung nhan vien (qua nang), giam max_tokens 2048->1024
  - Xu ly loi Groq API (rate_limit, error response) thay vi "Xin loi ko tra loi dc"
  - Them nut lam moi cuoc tro chuyen (RefreshCw)
  - Tat ca text tieng Viet co dau
  - Loading animation (bouncing dots)
- **Sidebar**: nut Giao dien sang/toi chuyen len TREN navigation, tach khoi nut Dang xuat
  - Nut giao dien co mau rieng (amber cho dark mode, indigo cho light mode)
- **Resource Table page**:
  - Them bo chon ngay (date picker) "Tu ngay - Den ngay" de loc bang phan bo
  - Sua tat ca text sang tieng Viet co dau
  - Sua option phong ban co dau
- **Dashboard**: fix >100% dem across tat ca cac tuan (ko chi tuan hien tai)
- **CSS**: them animation fadeIn, slideDown; them transition cho allocation cells
- **Cai dat UI/UX Pro Max skill**: `uipro init --ai claude`

## Cau truc file quan trong
- `backend/app/main.py` - Entry point FastAPI
- `backend/app/auth.py` - JWT auth logic (hash, verify, token, dependencies)
- `backend/app/models/` - Database models (Employee, Project, ResourceAllocation, User)
- `backend/app/api/auth.py` - Auth API routes (login, register, me, seed-admin)
- `backend/app/api/dashboard.py` - Logic tinh toan dashboard
- `backend/app/api/import_excel.py` - Logic import Excel
- `backend/app/api/allocations.py` - Allocations CRUD + overload API
- `frontend/src/app/page.tsx` - Dashboard page
- `frontend/src/app/login/page.tsx` - Login page
- `frontend/src/lib/api.ts` - API client (axios + auth interceptor)
- `frontend/src/lib/auth.tsx` - AuthProvider context
- `frontend/src/lib/theme.tsx` - ThemeProvider context (dark/light mode)
- `frontend/src/app/providers.tsx` - Wraps ThemeProvider + AuthProvider
- `frontend/src/components/Sidebar.tsx` - Sidebar voi user info, logout, theme toggle
- `frontend/src/components/ResourceTable.tsx` - Bang phan bo heatmap
- `frontend/src/components/OverloadWarning.tsx` - Canh bao nhan vien qua tai
- `frontend/src/components/Chatbot.tsx` - AI Chatbot (goi qua backend proxy)
- `backend/app/api/chat.py` - Groq API proxy endpoint
- `frontend/src/components/AllocationFormModal.tsx` - Form phan bo nhan vien vao du an
- `docker-compose.yml` - Docker services config

## Luu y khi phat trien
- Du lieu goc tu file Excel co 26 nhan vien, 44 du an, 1450 allocation records
- Allocation percentage luu dang so thap phan (0.0 - 1.0), hien thi dang % (0-100%)
- Cac tuan tinh tu ngay Monday cua moi tuan
- Frontend giao tiep voi backend qua REST API (port 8000)
- Ma mau heatmap: xanh (>=100%), xanh nhat (80-99%), vang (60-79%), cam (40-59%), do (<40%)
- Sheet name Vietnamese trong Excel can normalize Unicode (NFC) truoc khi so sanh
- Docker COPY khong ho tro shell redirects - can dam bao source path ton tai
- Default accounts: admin/admin123 (admin role), employee/employee123 (employee role)
- JWT token expire: 480 phut (8 gio)
- Backend SECRET_KEY can thay doi trong production
- Groq API key luu trong backend env var (GROQ_API_KEY), frontend goi qua proxy /api/chat/
