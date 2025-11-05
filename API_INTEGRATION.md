# Hướng dẫn tích hợp API

## Cấu trúc API

Đã tạo các file API trong thư mục `src/lib/`:

### 1. `api.ts` - Base API functions
- `apiGet<T>()` - GET request
- `apiPost<T, D>()` - POST request  
- `apiPut<T, D>()` - PUT request
- `apiPatch<T, D>()` - PATCH request
- `apiDelete<T>()` - DELETE request
- `getAuthToken()` - Lấy token từ localStorage
- `setAuthToken()` - Lưu token
- `removeAuthToken()` - Xóa token

### 2. `auth.api.ts` - Authentication API
- `loginAdmin(credentials)` - Đăng nhập admin
- `refreshToken(token)` - Refresh token
- `logout()` - Đăng xuất
- `logoutAll()` - Đăng xuất tất cả thiết bị

### 3. `users.api.ts` - Users API
- `getAllUsers()` - Lấy danh sách tất cả users (Admin only)
- `getUserDetail(userId)` - Lấy chi tiết user
- `blockUser(userId)` - Chặn user (Admin only)

### 4. `jobs.api.ts` - Jobs/Services API
- `getAllJobs(params)` - Lấy tất cả jobs với pagination (Admin only)
- `getJobDetail(jobId)` - Lấy chi tiết job
- `blockJob(jobId)` - Chặn job (Admin only)
- `getCommunityJobs(params)` - Lấy jobs community feed

## Cấu hình

### 1. Tạo file `.env`
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 2. Cài đặt dependencies (nếu chưa có)
```powershell
npm install
```

### 3. Khởi động backend NestJS
```powershell
cd ..\Time_Bank_Nestjs
npm run start:dev
```

### 4. Khởi động frontend
```powershell
cd ..\Admindashboarddesign
npm run dev
```

## Components đã tích hợp API

### LoginPage.tsx
- Sử dụng `loginAdmin()` để đăng nhập
- Lưu token vào localStorage
- Xử lý lỗi đăng nhập

### UsersManagement.tsx
- Sử dụng `getAllUsers()` để tải danh sách users
- Sử dụng `blockUser()` để chặn user
- Loading state khi fetch data
- Hiển thị lỗi với toast notifications

### ServicesManagement.tsx
- Sử dụng `getAllJobs()` với pagination
- Sử dụng `blockJob()` để chặn dịch vụ
- Filter theo status
- Pagination support

## Cấu hình Backend cần thiết

### Trong backend NestJS, đảm bảo có:

1. **CORS enabled** trong `main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
});
```

2. **Environment variables** trong `.env`:
```env
ADMIN_IDS=id_cua_admin_user_1,id_cua_admin_user_2
JWT_SECRET=your_secret_key
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
```

3. **Tạo admin user** trong database với ID trong ADMIN_IDS

## Authentication Flow

1. User nhập username (fullname) và password
2. Frontend gọi `POST /auth/admin/login`
3. Backend trả về:
   - access_token
   - refresh_token
   - user info
   - firebase_token
4. Frontend lưu tokens vào localStorage
5. Mọi request sau đó tự động thêm `Authorization: Bearer {token}` header
6. Nếu token hết hạn (401), tự động xóa token và redirect về login

## Error Handling

Tất cả API calls đều có try-catch:
```typescript
try {
  const data = await getAllUsers();
  // xử lý data
} catch (error: any) {
  toast.error(error.message || 'Lỗi mặc định');
}
```

## Type Safety

Tất cả API functions đều có TypeScript types:
- Request types (LoginRequest, PaginationParams, etc.)
- Response types (User, Job, LoginResponse, etc.)
- Enum types (JobStatus, JobVisibility, etc.)

## Pagination

API hỗ trợ pagination với params:
```typescript
getAllJobs({
  page: 1,
  pageSize: 10,
  sortBy: 'created_at',
  sortOrder: 'desc',
  search: 'keyword',
  type: ['open', 'pending']
})
```

Response:
```typescript
{
  data: Job[],
  metadata: {
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }
}
```

## Các API endpoint backend cần bổ sung

1. **Unblock user** - Để bỏ chặn user
```typescript
POST /users/:userId/unblock-user
```

2. **Unblock job** - Để bỏ chặn job
```typescript
POST /jobs/:jobId/unblock-job
```

3. **Dashboard stats** - Thống kê cho dashboard
```typescript
GET /admin/stats
Response: {
  totalUsers: number,
  totalJobs: number,
  openJobs: number,
  growth: number
}
```

## Testing

Test API connection:
1. Khởi động backend
2. Khởi động frontend  
3. Mở browser console (F12)
4. Thử login với admin account
5. Check Network tab để xem API requests
6. Check Console cho errors

## Troubleshooting

### Lỗi CORS
- Kiểm tra `enableCors()` trong backend
- Đảm bảo origin khớp với frontend URL

### Token không được gửi
- Check localStorage có access_token không
- Check Authorization header trong Network tab

### 401 Unauthorized
- Token hết hạn hoặc không hợp lệ
- User không phải admin (không có trong ADMIN_IDS)

### Cannot connect to server
- Backend có đang chạy không?
- API_BASE_URL có đúng không?
- Port có bị conflict không?
