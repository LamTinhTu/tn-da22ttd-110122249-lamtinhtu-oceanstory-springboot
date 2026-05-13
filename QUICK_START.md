📋 QUICK START GUIDE - Hệ thống Kiểm duyệt Tác phẩm
================================================

## 🚀 Bắt đầu trong 3 bước

### 1️⃣ Run Backend
```bash
cd backend
mvn spring-boot:run
```

Trước khi chạy, tạo file `.env` từ `.env.example` và cấu hình DB/JWT (bắt buộc).

Nếu muốn tự bootstrap tài khoản quản trị để test nhanh (DEV ONLY), bật:
`BOOTSTRAP_ENABLED=true` và set `BOOTSTRAP_ADMIN_*` / `BOOTSTRAP_MODERATOR_*` trong `.env`.

### 2️⃣ Run Frontend
```bash
cd frontend
npm run dev
```

Mở browser: http://localhost:5173

### 3️⃣ Đăng nhập Admin
- URL: http://localhost:5173/admin/dashboard
- Username/Password: lấy từ `.env` (BOOTSTRAP_*) hoặc tự tạo trong DB

---

## 🧪 Test Flow

### A. Tạo test story (với user bình thường)
```
1. Logout nếu đang login admin
2. Click "Viết tác phẩm" trên Navbar
3. Login với tài khoản bình thường hoặc tạo account mới
4. Fill form:
   - Loại hình: "Một chương"
   - Tên tác phẩm: "Test Story"
   - Tóm tắt: "Đây là test"
   - Thể loại: "Ngôn tình"
   - Chủ đề: "Tình cảm"
5. Click "Gửi kiểm duyệt"
   → submissionStatus = SUBMITTED
```

### B. Kiểm duyệt story (với admin/moderator)
```
1. Đăng nhập bằng tài khoản có role ADMIN/MODERATOR
2. Vào http://localhost:5173/admin/dashboard
3. Thấy test story trong danh sách "Chờ duyệt"
4. Click "👀 Xem & Duyệt"
5. Chọn:
   ✅ Phê duyệt (APPROVED)
   hoặc
   ❌ Từ chối (REJECTED)
6. Thêm ghi chú (tuỳ chọn)
7. Click "✨ Xác nhận quyết định"
   → Story bị xóa khỏi danh sách pending
```

### C. Viết chapter (chỉ sau khi Approved)
```
1. Login với tài khoản tác giả
2. Vào trang story details
3. Click "Viết chapter"
4. Fill form chapter
5. Click "Lưu chapter"
   ✅ Nếu submissionStatus=APPROVED → Thành công
   ❌ Nếu submissionStatus≠APPROVED → Error message
```

---

## 📊 Dữ liệu test

Khuyến nghị tạo dữ liệu test bằng luồng thật:
- `POST /api/auth/register` để tạo user
- cập nhật role trong DB (ADMIN/MODERATOR) nếu cần

### Test User (Tạo manual)
```
Username: testuser
Password: Test@123456
Email: testuser@example.com
Role: USER (default)
```

---

## 🔍 Database Verification

Để verify admin account trong database:

### DBeaver Query
```sql
SELECT id, username, email, role, created_at 
FROM users 
WHERE username = '<bootstrap_username>';

-- Result:
-- | id | username  | email                   | role  | created_at          |
-- |----|-----------|-------------------------|-------|---------------------|
-- | 1  | <username> | <email>                | ADMIN | 2026-04-28 xx:xx:xx |
```

### Check Admin Notes Column
```sql
SELECT id, title, submission_status, admin_notes 
FROM stories;

-- admin_notes sẽ hiển thị ở đây khi admin add notes
```

---

## 🛠️ Troubleshooting

### Admin account không tạo được
**Problem**: Không bootstrap được admin/moderator
**Solution**:
1. Kiểm tra `.env` đã set `BOOTSTRAP_ENABLED=true` chưa
2. Kiểm tra `BOOTSTRAP_*_PASSWORD` có rỗng không
3. Check database xem account đã tồn tại chưa

### Login fail
**Problem**: Sai username/password hoặc user chưa có role phù hợp
**Solution**: Kiểm tra DB, hoặc bật bootstrap trong `.env` để tạo sẵn user.

### Admin dashboard không load stories
**Problem**: Pending stories list empty hoặc error
**Solution**:
1. Check backend logs
2. Verify token/authentication
3. Create test story first

---

## 📁 Liên quan files

- Backend: `DataInitializer.java` (bootstrap user nếu bật `BOOTSTRAP_ENABLED=true`)
- Frontend: `AdminDashboard.jsx` (/admin/dashboard)
- Database: schema quản lý bằng Flyway (`ddl-auto=validate`)
- Docs: `ADMIN_SYSTEM_SETUP.md` (đầy đủ)

---

## 💡 Notes

✅ Không seed dữ liệu/mật khẩu cứng khi backend start
✅ Nếu bật `BOOTSTRAP_ENABLED=true` thì backend sẽ bootstrap user từ `.env`
✅ Password đã hash bằng BCrypt
✅ Idempotent: chạy lại không duplicate

---

Happy testing! 🚀
