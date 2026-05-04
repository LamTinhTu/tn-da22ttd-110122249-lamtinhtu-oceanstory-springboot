📋 QUICK START GUIDE - Hệ thống Kiểm duyệt Tác phẩm
================================================

## 🚀 Bắt đầu trong 3 bước

### 1️⃣ Run Backend
```bash
cd backend
mvn spring-boot:run
```

**Chờ console hiển thị:**
```
✅ Tài khoản admin mới được tạo:
   Username: kiemduyet
   Email: kiemduyet@ocean.local
   Role: ADMIN
   Password: [hashed]
```

### 2️⃣ Run Frontend
```bash
cd frontend
npm run dev
```

Mở browser: http://localhost:5173

### 3️⃣ Đăng nhập Admin
- URL: http://localhost:5173/admin/dashboard
- Username: `kiemduyet`
- Password: `Kiemduyet@12345678`

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

### B. Kiểm duyệt story (với admin)
```
1. Đăng nhập: kiemduyet / Kiemduyet@12345678
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

### Admin Account (Tự động tạo)
```
Username: kiemduyet
Password: Kiemduyet@12345678
Email: kiemduyet@ocean.local
Role: ADMIN
```

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
WHERE username = 'kiemduyet';

-- Result:
-- | id | username  | email                   | role  | created_at          |
-- |----|-----------|-------------------------|-------|---------------------|
-- | 1  | kiemduyet | kiemduyet@ocean.local  | ADMIN | 2026-04-28 xx:xx:xx |
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
**Problem**: Console không hiển thị message tạo admin account
**Solution**:
1. Check database xem account đã tồn tại chưa
2. Check application.yml → datasource config
3. Restart backend

### Login admin fail
**Problem**: Sai username/password
**Solution**:
```
Username: kiemduyet (chính xác)
Password: Kiemduyet@12345678 (chính xác)
```

### Admin dashboard không load stories
**Problem**: Pending stories list empty hoặc error
**Solution**:
1. Check backend logs
2. Verify token/authentication
3. Create test story first

---

## 📁 Liên quan files

- Backend: `DataInitializer.java` (tự động tạo admin)
- Frontend: `AdminDashboard.jsx` (/admin/dashboard)
- Database: `V3__Add_admin_review_system.sql` (migration)
- Docs: `ADMIN_SYSTEM_SETUP.md` (đầy đủ)

---

## 💡 Notes

✅ Admin account được tạo **tự động** khi backend start
✅ Password đã hash bằng BCrypt
✅ Email: kiemduyet@ocean.local
✅ Role: ADMIN
✅ Idempotent: Chạy lại không duplicate

---

Happy testing! 🚀
