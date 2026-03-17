# CLAUDE.md - Dự án Quản lý Nguồn lực Nhân sự IBS

## Tổng quan
Dự án web app quản lý phân bổ nguồn lực nhân sự dự án cho Trung tâm IBS (iERP Services JSC).
Xây dựng dựa trên dữ liệu từ file Excel `IBS_Resource Plan_2026.xlsx`.

## Tech Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React 18, Next.js 14 (App Router), TailwindCSS, Recharts, Lucide Icons
- **Database**: PostgreSQL 16
- **Deploy**: Docker Compose (3 services: db, backend, frontend)
- **Auth**: JWT (python-jose), bcrypt (passlib)
- **AI Chatbot**: Groq API (llama-3.3-70b-versatile + 2 model dự phòng)

## Lịch sử thay đổi

### 2026-03-16 - Khởi tạo dự án
- Tạo cấu trúc dự án backend + frontend + docker
- **Backend**:
  - Models: Employee, Project, ResourceAllocation (SQLAlchemy)
  - Schemas: Pydantic validation cho mỗi model
  - API routes: CRUD employees, projects, allocations
  - Dashboard API: summary (KPI, charts data), resource-table (heatmap data), employee-detail
  - Import Excel API: đọc file .xlsx và import dữ liệu từ 3 sheet (DS Nhân viên, DS Dự án, Resource Plan)
- **Frontend**:
  - Dashboard page: 5 KPI cards, 4 biểu đồ (pie charts, bar chart, line chart), bảng phân bổ nguồn lực
  - Employees page: CRUD với form modal, bộ lọc (phòng ban, level, trạng thái), tìm kiếm
  - Projects page: CRUD với form modal, bộ lọc (trạng thái), tìm kiếm
  - Resource Table page: bảng heatmap phân bổ, modal chi tiết nhân viên, bộ lọc
  - Import page: upload file Excel, hiển thị kết quả import
  - Components: Sidebar, StatCard, DashboardCharts, ResourceTable, EmployeeDetailModal
- **Docker**: docker-compose.yml với 3 services (postgres, backend, frontend)
- **Documentation**: README.md với hướng dẫn cài đặt và sử dụng

### 2026-03-16 - Deploy và test
- Fix Dockerfile frontend: xóa `2>/dev/null || true` trong COPY (Docker không hỗ trợ shell syntax), tạo thư mục `public/`
- Fix import Excel: sheet name Vietnamese Unicode (NFC vs NFD) không match -> thêm hàm `find_sheet()` dùng `unicodedata.normalize("NFC")` để so sánh
- Deploy thành công lên Docker (3 containers: hr_postgres, hr_backend, hr_frontend)
- Test kết quả import: 26 employees, 44 projects, 1450 allocations
- Test CRUD employees: CREATE, UPDATE, DELETE đều OK (status 201, 200, 204)
- Test dashboard API: summary, resource-table, employee-detail đều trả dữ liệu chính xác
- Test frontend: tất cả 5 trang đều trả HTTP 200 (/, /employees, /projects, /resource-table, /import)

### 2026-03-17 - Thêm tính năng Auth, Dark Mode, Overload Warning, Chatbot
- **Authentication & Authorization**:
  - Backend: User model (username, hashed_password, full_name, role), JWT token auth
  - `backend/app/auth.py`: hash_password, verify_password, create_access_token, get_current_user, require_admin, require_login
  - `backend/app/api/auth.py`: POST /api/auth/login, GET /api/auth/me, POST /api/auth/register (admin only), GET /api/auth/users (admin only), POST /api/auth/seed-admin
  - Backend CRUD endpoints (employees, projects, allocations) protected: GET = public, POST/PUT/DELETE = admin only
  - Frontend: AuthProvider context (`frontend/src/lib/auth.tsx`), axios interceptor tự động thêm JWT token
  - Trang login (`frontend/src/app/login/page.tsx`) với demo credentials (admin/admin123, employee/employee123)
  - Auth guard trên tất cả trang: redirect về /login nếu chưa đăng nhập
  - Admin: thấy nút CRUD (Thêm, Sửa, Xóa). Employee: chỉ xem
  - Sidebar hiển thị thông tin user (tên, role, nút đăng xuất)
- **Overload Warning**:
  - `backend/app/api/allocations.py`: thêm GET /api/allocations/overload, POST/PUT trả warning khi employee >100%
  - `frontend/src/components/OverloadWarning.tsx`: banner cảnh báo nhân viên quá tải, hiển thị chi tiết dự án
- **Dark Mode**:
  - ThemeProvider context (`frontend/src/lib/theme.tsx`), lưu localStorage, toggle class 'dark' trên html
  - `frontend/tailwind.config.ts`: darkMode: 'class'
  - Tất cả pages và components đã được cập nhật với dark mode classes
  - Nút chuyển dark/light mode trong Sidebar và trang Login
- **AI Chatbot**:
  - `frontend/src/components/Chatbot.tsx`: floating button góc phải dưới, cửa sổ chat
  - Sử dụng Groq API (llama-3.3-70b-versatile) để trả lời câu hỏi về nhân sự
  - Tự động lấy dữ liệu real-time từ dashboard, employees, projects, resource-table làm context
  - Chatbot hiển thị trên tất cả trang (Dashboard, Employees, Projects, Resource Table, Import)

### 2026-03-17 - Thêm tính năng phân bổ nhân viên
- **Allocation Form Modal** (`frontend/src/components/AllocationFormModal.tsx`):
  - Admin có thể phân bổ nhân viên vào dự án từ trang Bảng phân bổ
  - Chọn nhân viên, dự án, tỷ lệ %, khoảng thời gian (từ ngày - đến ngày)
  - Tự động tính các tuần (Monday) trong khoảng thời gian và tạo allocation cho mỗi tuần
  - Hỗ trợ phân bổ cho BẤT KỲ tháng nào (không giới hạn bởi dữ liệu Excel)
  - Hiển thị cảnh báo khi nhân viên đang 100%+ trước khi thêm (check real-time)
  - Sau khi lưu, hiển thị cảnh báo overload từ server nếu vượt 100%
  - Vẫn cho phép lưu dù vượt 100% (chỉ cảnh báo, không chặn)
- Thêm `bulkCreateAllocation` API function trong `frontend/src/lib/api.ts`
- Cập nhật `frontend/src/app/resource-table/page.tsx`: thêm nút "Phân bổ nhân viên" cho admin, reload data sau khi phân bổ
- **Inline Edit Allocation** trong `EmployeeDetailModal`:
  - Admin click vào ô % trong chi tiết nhân viên để chỉnh sửa trực tiếp
  - Nhập % mới, Enter để lưu, Escape để hủy
  - Hiển thị cảnh báo overload sau khi lưu nếu tổng > 100%
  - Tự động reload data sau khi chỉnh sửa
  - Backend `employee-detail` API thêm trả về `project_id` để frontend biết update đúng dự án
- **Chatbot đọc sâu hơn**:
  - Fetch chi tiết phân bổ từng nhân viên (từng dự án, % theo tuần)
  - Fetch danh sách overload chi tiết (dự án cụ thể, % cụ thể)
  - Cung cấp dữ liệu allocation summary (TB/Max/Min %) cho mỗi nhân viên
  - Tăng max_tokens lên 2048, system prompt chi tiết hơn

### 2026-03-17 - UI/UX và Deploy
- **Sidebar**:
  - Thêm nút đóng/mở (collapse) sidebar
  - Chuyển nút đăng xuất + đổi giao diện sáng/tối lên trên cùng (icon buttons)
  - Đổi tất cả label sang tiếng Việt có dấu (Tổng quan, Nhân sự, Dự án, Bảng phân bổ, Nhập dữ liệu)
- **Chatbot**: đổi màu nút từ xanh lá sang xanh dương để dễ phân biệt
- **Vietnamese**: tất cả header, button, label, placeholder đã đổi sang tiếng Việt có dấu đầy đủ
- **Deploy**: thêm `render.yaml` cho deploy lên Render.com (free tier)
  - PostgreSQL free database
  - Backend + Frontend web services
  - Dockerfile update: backend bỏ --reload, frontend dùng ARG cho NEXT_PUBLIC_API_URL

### 2026-03-17 - Fix bugs và UI improvements
- **Fix Nhân sự >100% sai**: backend tính tổng allocation trong +-7 ngày (2 tuần) gây cộng dồn sai -> sửa lại chỉ tính đúng tuần hiện tại (`week_start == current_week_start`)
- **Sidebar nút to hơn**: nút Đăng xuất và Đổi giao diện chuyển xuống dưới, thêm text label ("Đăng xuất", "Giao diện sáng/tối"), kích thước lớn hơn để người dùng dễ nhìn
- **Mở rộng date range**: employee-detail và resource-table API mở rộng từ 16 tuần thành cả năm (1/1 - 31/12), cho phép xem phân bổ tháng 12+
- **Docker Compose**: thêm build args để truyền NEXT_PUBLIC_API_URL khi build local
- **AI Chatbot proxy**: chuyển từ gọi trực tiếp Groq API ở frontend sang gọi qua backend proxy `/api/chat/` để bảo mật API key
  - Thêm `backend/app/api/chat.py`: proxy endpoint gọi Groq API với key từ server-side env var
  - Thêm `GROQ_API_KEY` vào `backend/app/config.py`
  - Thêm `httpx` vào backend requirements
  - Frontend Chatbot.tsx gọi `${API_URL}/api/chat/` thay vì trực tiếp Groq
  - Fix lỗi chatbot không hoạt động trên Render (API key không có lúc Docker build)

### 2026-03-17 - UI/UX improvements (UI Pro Max skill)
- **EmployeeDetailModal cải thiện**:
  - Tất cả text chuyển sang tiếng Việt có dấu (Dự án, Tổng, warning messages)
  - Thêm nút Save/Cancel khi edit % (trước chỉ có input, giờ có nút xanh/xám)
  - Thêm success feedback ("Đã cập nhật thành X%") tự động ẩn sau 2.5s
  - Backdrop blur + shadow cho modal, gradient header
  - Loading spinner thay vì text "Đang tải..."
  - Skip save khi giá trị không thay đổi
- **Chatbot cải thiện**:
  - Cache context 2 phút để giảm API calls
  - Giảm context size: bỏ chi tiết phân bổ từng nhân viên (quá nặng), giảm max_tokens 2048->1024
  - Xử lý lỗi Groq API (rate_limit, error response) thay vì "Xin lỗi không trả lời được"
  - Thêm nút làm mới cuộc trò chuyện (RefreshCw)
  - Tất cả text tiếng Việt có dấu
  - Loading animation (bouncing dots)
- **Sidebar**: nút Giao diện sáng/tối chuyển lên TRÊN navigation, tách khỏi nút Đăng xuất
  - Nút giao diện có màu riêng (amber cho dark mode, indigo cho light mode)
- **Resource Table page**:
  - Thêm bộ chọn ngày (date picker) "Từ ngày - Đến ngày" để lọc bảng phân bổ
  - Sửa tất cả text sang tiếng Việt có dấu
  - Sửa option phòng ban có dấu
- **Dashboard**: fix >100% đếm across tất cả các tuần (không chỉ tuần hiện tại)
- **CSS**: thêm animation fadeIn, slideDown; thêm transition cho allocation cells
- **Cài đặt UI/UX Pro Max skill**: `uipro init --ai claude`

### 2026-03-17 - Chatbot fallback models, ẩn tuần trống, UI tổng thể
- **Chatbot fallback models** (`backend/app/api/chat.py`):
  - Model chính: llama-3.3-70b-versatile (chất lượng cao nhất)
  - Dự phòng 1: llama-3.1-8b-instant (nhanh, nhẹ)
  - Dự phòng 2: gemma2-9b-it (thay thế)
  - Tự động chuyển model khi gặp rate limit hoặc lỗi token
- **Ẩn tuần trống trong bảng phân bổ**: backend lọc `total_alloc <= 0`, chỉ hiện tuần có phân bổ thực tế
- **Sidebar collapse redesign**: đổi từ nút pill nổi sang nút inline trong header (PanelLeftClose/PanelLeftOpen), hòa hợp với sidebar
- **UI/UX tổng thể (quét toàn bộ frontend)**:
  - Tiếng Việt có dấu: AllocationFormModal, OverloadWarning, ImportPage, LoginPage - tất cả label, button, thông báo
  - cursor-pointer + transition-colors: tất cả button trên mọi trang
  - Touch targets lớn hơn: nút edit/delete từ p-1 lên p-2, icon 14->16px (đạt 44px UX guideline)
  - Modals cải thiện: backdrop-blur-sm, rounded-xl, shadow-2xl, border
  - Dashboard: loading spinner thay text, responsive grid (KPI 2/3/5 cols, charts 1/2/4 cols)
  - Form modals: gradient header, improved close button

## Cấu trúc file quan trọng
- `backend/app/main.py` - Entry point FastAPI
- `backend/app/auth.py` - JWT auth logic (hash, verify, token, dependencies)
- `backend/app/models/` - Database models (Employee, Project, ResourceAllocation, User)
- `backend/app/api/auth.py` - Auth API routes (login, register, me, seed-admin)
- `backend/app/api/dashboard.py` - Logic tính toán dashboard
- `backend/app/api/import_excel.py` - Logic import Excel
- `backend/app/api/allocations.py` - Allocations CRUD + overload API
- `backend/app/api/chat.py` - Groq API proxy endpoint (3 model fallback)
- `frontend/src/app/page.tsx` - Dashboard page
- `frontend/src/app/login/page.tsx` - Trang đăng nhập
- `frontend/src/lib/api.ts` - API client (axios + auth interceptor)
- `frontend/src/lib/auth.tsx` - AuthProvider context
- `frontend/src/lib/theme.tsx` - ThemeProvider context (dark/light mode)
- `frontend/src/app/providers.tsx` - Wraps ThemeProvider + AuthProvider
- `frontend/src/components/Sidebar.tsx` - Sidebar với user info, logout, theme toggle, collapse
- `frontend/src/components/ResourceTable.tsx` - Bảng phân bổ heatmap
- `frontend/src/components/OverloadWarning.tsx` - Cảnh báo nhân viên quá tải
- `frontend/src/components/Chatbot.tsx` - AI Chatbot (gọi qua backend proxy)
- `frontend/src/components/AllocationFormModal.tsx` - Form phân bổ nhân viên vào dự án
- `frontend/src/components/EmployeeDetailModal.tsx` - Chi tiết phân bổ + inline edit
- `docker-compose.yml` - Docker services config

## Lưu ý khi phát triển
- Dữ liệu gốc từ file Excel có 26 nhân viên, 44 dự án, 1450 allocation records
- Allocation percentage lưu dạng số thập phân (0.0 - 1.0), hiển thị dạng % (0-100%)
- Các tuần tính từ ngày Monday của mỗi tuần
- Phân bổ hỗ trợ bất kỳ khoảng thời gian nào (không giới hạn bởi Excel)
- Frontend giao tiếp với backend qua REST API (port 8000)
- Mã màu heatmap: xanh (>=100%), xanh nhạt (80-99%), vàng (60-79%), cam (40-59%), đỏ (<40%)
- Sheet name Vietnamese trong Excel cần normalize Unicode (NFC) trước khi so sánh
- Docker COPY không hỗ trợ shell redirects - cần đảm bảo source path tồn tại
- Default accounts: admin/admin123 (admin role), employee/employee123 (employee role)
- JWT token expire: 480 phút (8 giờ)
- Backend SECRET_KEY cần thay đổi trong production
- Groq API key lưu trong backend env var (GROQ_API_KEY), frontend gọi qua proxy /api/chat/
- Chatbot có 3 model dự phòng: tự động chuyển khi model chính gặp rate limit
