# 🔐 Hệ thống Phân quyền Kiểm duyệt

## 📋 Yêu cầu hệ thống
- Backend: Spring Boot running on http://localhost:8080
- Database: PostgreSQL với migration V3 applied
- Frontend: React running on http://localhost:5173

---

## 🚀 Hướng dẫn cài đặt

### 1. **Database Migration** 
✅ Lưu ý về database schema:
- Dự án quản lý schema bằng Flyway.
- Hibernate chỉ validate schema (`spring.jpa.hibernate.ddl-auto=validate`).
```sql
-- Thêm cột admin_notes vào bảng stories
-- Hướng dẫn: chạy backend, Flyway sẽ tự động apply migration
```

### 2. **Bootstrap tài khoản Admin/Moderator (tuỳ chọn - DEV ONLY)** ⭐

Mặc định hệ thống **không seed** dữ liệu/mật khẩu cứng khi start.

#### Cách 1: Bootstrap khi start backend (Khuyên dùng cho DEV) ⭐
```bash
cd backend
mvn spring-boot:run
```

Tạo file `.env` từ `.env.example` và bật:
`BOOTSTRAP_ENABLED=true`.

**Quá trình:**
1. Backend start
2. Nếu `BOOTSTRAP_ENABLED=true` → Spring Boot gọi `DataInitializer.run()`
3. Tạo/update user theo `BOOTSTRAP_ADMIN_*` và `BOOTSTRAP_MODERATOR_*`
4. Không in mật khẩu ra log

#### Cách 2: Manual via Postman (Backup)
Có thể tạo user thường bằng API register, sau đó nâng quyền trong DB:
```
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "<username>",
  "email": "<email>",
  "password": "<password>"
}
```

Sau đó chạy SQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'kiemduyet';
```

### 3. **Backend Endpoints** 

#### Admin - Lấy danh sách chờ duyệt
```
GET /api/stories/admin/pending
Headers: Authorization: Bearer <token>
Response: List<StoryResponse>
```

#### Admin - Phê duyệt/Từ chối truyện
```
PUT /api/stories/{id}/review
Headers: Authorization: Bearer <token>
Body: 
{
  "approvalStatus": "APPROVED" // hoặc "REJECTED"
  "adminNotes": "Ghi chú từ admin"
}
```

### 4. **Frontend Routes**

#### Admin Dashboard
```
http://localhost:5173/admin/dashboard

Features:
- Hiển thị danh sách truyện chờ duyệt (submissionStatus = SUBMITTED)
- Xem chi tiết: tác giả, đồng tác giả, mô tả, thể loại, chủ đề
- Phê duyệt: Chuyển submissionStatus → APPROVED
- Từ chối: Chuyển submissionStatus → REJECTED + ghi chú
- Real-time update: Xóa khỏi danh sách sau khi duyệt
```

---

## ✅ Quy trình làm việc

### Tác giả
1. Đăng nhập
2. Vào trang "Viết tác phẩm"
3. Điền form: loại hình, tên, tác giả, đồng tác giả, tóm tắt, thể loại, chủ đề
4. Click "Gửi kiểm duyệt" → submissionStatus = SUBMITTED
5. Chờ admin duyệt (24-48 giờ)

### Admin
1. Đăng nhập với tài khoản có role ADMIN/MODERATOR
2. Vào Admin Dashboard (/admin/dashboard)
3. Xem danh sách truyện chờ duyệt
4. Click "Xem & Duyệt" trên truyện cần xem
5. Chọn "Phê duyệt" hoặc "Từ chối"
6. Thêm ghi chú (tuỳ chọn)
7. Click "Xác nhận quyết định"

### Tác giả sau khi Approved
1. Vào trang "Viết tác phẩm"
2. Truyện đã được duyệt (submissionStatus = APPROVED)
3. Bây giờ có thể viết chapter

---

## 🛠 Kiến trúc hệ thống

### Backend
- **Service**: StoryService.getPendingStories(), StoryService.reviewStory()
- **Controller**: GET /api/stories/admin/pending, PUT /api/stories/{id}/review
- **Entity**: Story + adminNotes field, SubmissionStatus enum
- **Validation**: ChapterService blocks chapter creation nếu submissionStatus ≠ APPROVED

### Frontend
- **Pages**: AdminDashboard.jsx (/admin/dashboard)
- **Styles**: admin.css (gradient backgrounds, responsive cards)
- **API**: Axios calls to backend admin endpoints
- **Auth**: Token-based (Authorization header)

### Database
- **Column**: stories.admin_notes (TEXT)
- **Account**: users with role = 'ADMIN'
- **Table**: Tất cả existing tables

---

## 🧪 Testing Checklist

- [ ] Chạy backend: `cd backend && mvn spring-boot:run`
- [ ] **Chờ console hiển thị**: "✅ Tài khoản admin mới được tạo" (hoặc "đã tồn tại")
- [ ] Migration V3 apply xong (check logs)
- [ ] Chạy frontend: `cd frontend && npm run dev`
- [ ] Login với user có role ADMIN/MODERATOR
- [ ] Vào /admin/dashboard  
- [ ] Tạo test story với user khác
- [ ] Submit story for review
- [ ] Xem story trong admin dashboard
- [ ] Phê duyệt → Verify có thể write chapter
- [ ] Reject với notes → Verify user thấy ghi chú
- [ ] UI responsive trên mobile

---

## 📝 Ghi chú quan trọng

1. **Role-based access**: Frontend hiện chưa check role client-side (sẽ validate trên backend)
2. **Submission workflow**: DRAFT → SUBMITTED → APPROVED/REJECTED
3. **Chapter protection**: Chỉ có thể write chapter khi submissionStatus = APPROVED
4. **Admin notes**: Stored in story.adminNotes, displayed to user if REJECTED
5. **Real-time**: UI updates immediately after approve/reject

---

## 📊 Status Tracking

```
Story Creation Flow:
✅ Backend endpoints created
✅ Frontend dashboard created
✅ Database migration ready
✅ Chapter protection added
✅ Admin account setup guide provided
⏳ Frontend admin role detection (TODO)
⏳ Admin link in Navbar (TODO)
⏳ Rejection reason display to user (TODO)
```
