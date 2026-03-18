# Quản lý Nguồn lực Nhân sự - Trung tâm IBS

Hệ thống quản lý phân bổ nguồn lực nhân sự dự án cho Trung tâm IBS (iERP Services JSC).

## Tech Stack

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy
- **Frontend**: React 18 + Next.js 14 + TailwindCSS + Recharts
- **Database**: PostgreSQL 16
- **Auth**: JWT + bcrypt
- **AI**: Groq API (llama-3.3-70b-versatile + 2 model dự phòng)
- **Deploy**: Docker Compose / Render.com

## Tính năng

### Đăng nhập & Phân quyền
- Đăng nhập bằng username/password (JWT token)
- 2 role: Admin (full CRUD) và Employee (chỉ xem)
- Tài khoản mặc định: admin/admin123, employee/employee123
- Auth guard: tự động redirect về trang login nếu chưa đăng nhập

### Tổng quan (Dashboard)
- Tổng quan số lượng nhân sự, dự án đang thực hiện
- Tỷ lệ tham gia dự án (%)
- Cảnh báo nhân sự quá tải (>100%) và chưa đủ việc (<60%, chỉ tính từ hôm nay trở đi)
- **7 bộ lọc đa tiêu chí**: Từ tuần, Đến tuần (date picker), Phòng ban, Loại nhân sự, Trạng thái dự án, Quản trị dự án, Tên dự án (multi-select)
- Biểu đồ phân bổ nhân sự theo phòng ban, level (Pie Chart với side-legend)
- Biểu đồ trạng thái dự án (Bar Chart ngang)
- Biểu đồ xu hướng tỷ lệ tham gia theo tuần (Line Chart)
- Banner cảnh báo overload (nhân viên >100% phân bổ)
- Bảng phân bổ nguồn lực (heatmap) tích hợp ngay trên dashboard
- **Click tên nhân viên** để xem dropdown chi tiết % từng dự án theo tuần
- Nhóm nhân viên theo phòng ban, đánh dấu tuần hiện tại
- Bảng màu xanh lá dịu (Soft Green) - dễ nhìn, không chói
- Responsive grid: tự động điều chỉnh theo kích thước màn hình

### Quản lý Nhân sự (CRUD - Admin only)
- Thêm/sửa/xóa nhân viên
- Lọc theo phòng ban, level, trạng thái
- Tìm kiếm theo tên

### Quản lý Dự án (CRUD - Admin only)
- Thêm/sửa/xóa dự án
- Lọc theo trạng thái, PM
- Tìm kiếm theo tên dự án

### Bảng phân bổ nguồn lực
- Hiển thị bảng phân bổ nhân viên x tuần (heatmap)
- Click vào nhân viên để xem chi tiết phân bổ theo từng dự án
- Lọc theo phòng ban, tìm kiếm nhân viên
- Bộ chọn ngày (date picker) để lọc bảng theo khoảng thời gian bất kỳ
- Mã màu theo mức độ phân bổ (xanh lá đậm 100%, xanh lá nhạt 60-79%, vàng nhạt 40-59%, hồng nhạt <40%)
- Chỉ hiển thị tuần có phân bổ thực tế (ẩn tuần trống)

### Phân bổ nhân viên vào dự án (Admin)
- Nút "Phân bổ nhân viên" trong trang Bảng phân bổ
- Chọn nhân viên, dự án, tỷ lệ %, khoảng thời gian (từ ngày - đến ngày)
- Hỗ trợ phân bổ cho **bất kỳ tháng/năm nào** (không giới hạn bởi dữ liệu Excel)
- Tự động tính các tuần (thứ Hai) trong khoảng và tạo allocation
- Cảnh báo khi nhân viên đã 100%+ trước khi thêm (check real-time)
- Vẫn cho phép lưu dù vượt 100% (chỉ cảnh báo, không chặn)

### Chỉnh sửa % phân bổ trực tiếp (Admin)
- Click vào ô % trong modal chi tiết nhân viên để chỉnh sửa
- Nút Save/Cancel hiển thị khi đang edit, hoặc Enter để lưu, Escape để hủy
- Hiển thị thông báo thành công sau khi lưu, cảnh báo overload nếu tổng > 100%

### Import Excel
- Upload file Excel (định dạng IBS_Resource Plan)
- Tự động import nhân viên, dự án và phân bổ nguồn lực

### Giao diện Sáng/Tối (Dark Mode)
- Chuyển đổi giao diện sáng/tối
- Nút toggle trong Sidebar (phía trên navigation) và trang Login
- Lưu preference vào localStorage

### AI Chatbot
- Nút chat xanh dương góc phải dưới màn hình
- Hỏi đáp về nhân sự, dự án, phân bổ nguồn lực
- Đọc dữ liệu sâu: chi tiết phân bổ từng nhân viên (dự án, % theo tuần), danh sách overload
- Ví dụ: "Có bao nhiêu nhân viên ở phòng ban X?", "Ai đang rảnh?", "Dự án nào đang hoạt động?"
- API key bảo mật: frontend gọi qua backend proxy `/api/chat/`, key chỉ lưu server-side
- 3 model dự phòng: tự động chuyển khi model chính gặp rate limit

### Sidebar thu gọn
- Nút đóng/mở sidebar (collapse/expand) tích hợp trong header
- Nút đổi giao diện sáng/tối nằm TRÊN navigation (dễ nhìn, dễ truy cập)
- Nút đăng xuất nằm dưới cùng với thông tin user
- Tất cả label tiếng Việt có dấu: Tổng quan, Nhân sự, Dự án, Bảng phân bổ, Nhập dữ liệu

### API
- RESTful API đầy đủ cho employees, projects, allocations
- API dashboard summary và resource table
- Bulk create/update allocations
- Lọc và tìm kiếm trên tất cả endpoints
- Overload detection API

## Hướng dẫn cài đặt

### Yêu cầu
- Docker và Docker Compose

### Chạy ứng dụng

```bash
# Clone và di chuyển vào thư mục dự án
cd HumanResource

# Khởi động tất cả services
docker-compose up --build

# Truy cập ứng dụng
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Đăng nhập

- **Admin**: username `admin`, password `admin123` (có quyền CRUD)
- **Nhân viên**: username `employee`, password `employee123` (chỉ xem)

### Import dữ liệu từ Excel

1. Đăng nhập với tài khoản admin
2. Truy cập http://localhost:3000/import
3. Upload file `IBS_Resource Plan_2026.xlsx`
4. Hệ thống sẽ tự động tạo nhân viên, dự án và phân bổ nguồn lực

### Deploy lên Render.com (miễn phí)

1. Push code lên GitHub
2. Vào [render.com](https://render.com), đăng ký/đăng nhập
3. Chọn **New** > **Blueprint** > kết nối GitHub repo
4. Render sẽ đọc file `render.yaml` và tự động tạo:
   - PostgreSQL database (free)
   - Backend service (Docker)
   - Frontend service (Docker)
5. Thêm env var `GROQ_API_KEY` cho backend service (để chatbot hoạt động)
6. Sau khi deploy xong, cập nhật `CORS_ORIGINS` của backend với URL thực tế của frontend
7. Truy cập URL frontend để sử dụng

### Chạy development (không Docker)

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

## Cấu trúc dự án

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
│           ├── chat.py        # Groq API proxy (3 model fallback)
│           └── import_excel.py
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app/               # Next.js pages
│       │   ├── layout.tsx     # Root layout (Providers)
│       │   ├── providers.tsx  # Theme + Auth providers
│       │   ├── page.tsx       # Dashboard (Tổng quan)
│       │   ├── login/         # Trang đăng nhập
│       │   ├── employees/     # Quản lý nhân sự
│       │   ├── projects/      # Quản lý dự án
│       │   ├── resource-table/# Bảng phân bổ
│       │   └── import/        # Nhập dữ liệu Excel
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

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | /api/auth/login | Đăng nhập (JWT) | Public |
| GET | /api/auth/me | Thông tin user | Login |
| POST | /api/auth/register | Đăng ký user | Admin |
| POST | /api/auth/seed-admin | Tạo tài khoản mặc định | Public |
| GET | /api/employees/ | Danh sách nhân viên | Public |
| POST | /api/employees/ | Thêm nhân viên | Admin |
| PUT | /api/employees/{id} | Cập nhật nhân viên | Admin |
| DELETE | /api/employees/{id} | Xóa nhân viên | Admin |
| GET | /api/projects/ | Danh sách dự án | Public |
| POST | /api/projects/ | Thêm dự án | Admin |
| PUT | /api/projects/{id} | Cập nhật dự án | Admin |
| DELETE | /api/projects/{id} | Xóa dự án | Admin |
| GET | /api/allocations/ | Danh sách phân bổ | Public |
| POST | /api/allocations/ | Thêm phân bổ | Admin |
| GET | /api/allocations/overload | Nhân viên quá tải | Public |
| POST | /api/allocations/bulk | Thêm/cập nhật nhiều phân bổ | Admin |
| GET | /api/dashboard/summary | Tổng quan dashboard | Public |
| GET | /api/dashboard/resource-table | Bảng phân bổ nguồn lực | Public |
| GET | /api/dashboard/employee-detail/{id} | Chi tiết phân bổ nhân viên | Public |
| POST | /api/chat/ | Proxy chat tới Groq API | Public |
| POST | /api/import/excel | Import dữ liệu từ Excel | Public |
