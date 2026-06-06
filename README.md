# PTIT EDU - Frontend

Frontend của hệ thống học tập trực tuyến **PTIT EDU**, được xây dựng bằng React và Vite, cung cấp giao diện cho sinh viên, giảng viên và quản trị viên trong quá trình học tập và quản lý đào tạo.

## Giới thiệu

PTIT EDU là hệ thống quản lý học tập trực tuyến hỗ trợ:

* Quản lý lớp học
* Quản lý tài liệu học tập
* Tổ chức thi trực tuyến
* Theo dõi kết quả học tập
* Trao đổi trong lớp học
* Hỗ trợ người dùng bằng Chatbot AI

Frontend đóng vai trò giao tiếp giữa người dùng và hệ thống thông qua các API được cung cấp bởi backend.

---

## Công nghệ sử dụng

* React
* Vite
* React Router DOM
* Axios
* Material UI (MUI)
* CSS

---

## Chức năng chính

### Xác thực người dùng

* Đăng nhập hệ thống
* Quản lý phiên đăng nhập
* Phân quyền theo vai trò

### Admin

* Quản lý người dùng
* Quản lý học kỳ
* Quản lý lớp học
* Quản lý thông báo

### Teacher

* Quản lý lớp học
* Quản lý tài liệu học tập
* Quản lý ngân hàng câu hỏi
* Tạo đề thi
* Theo dõi kết quả học tập của sinh viên

### Student

* Xem lớp học
* Xem tài liệu
* Làm bài thi trực tuyến
* Xem kết quả làm bài
* Quản lý ghi chú học tập

### Chat lớp học

* Gửi và nhận tin nhắn
* Gửi hình ảnh trong lớp học
* Trao đổi giữa giảng viên và sinh viên

### Chatbot AI

* Hỗ trợ sử dụng hệ thống
* Hỗ trợ học tập
* Trả lời dựa trên tài liệu đã được cung cấp
* Hỗ trợ phân tích tài liệu và hình ảnh
* Lưu lịch sử hội thoại

---

## Cài đặt

Clone repository:

```bash
git clone <repository-url>
cd Frontend_LMS_With_ChatBotAI
```

Cài đặt dependencies:

```bash
npm install
```

---

## Cấu hình môi trường

Tạo file `.env`:

```env
VITE_BACKEND_URL=http://localhost:8888/v1/api
```

Điều chỉnh URL backend phù hợp với môi trường triển khai.

---

## Chạy dự án

Môi trường development:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview production:

```bash
npm run preview
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

---

## Cấu trúc thư mục

```text
src
├── api
├── assets
├── components
├── features
├── layouts
├── pages
├── routes
├── services
├── utils
└── App.jsx
```

---

## Yêu cầu hệ thống

* Node.js >= 18
* Backend PTIT EDU đang hoạt động
* Trình duyệt hiện đại (Chrome, Edge, Firefox)

---

## Tích hợp Backend

Frontend sử dụng Axios để giao tiếp với hệ thống Backend PTIT EDU thông qua REST API.

Các module chính được kết nối bao gồm:

* Authentication
* User Management
* Course Management
* Material Management
* Question Bank
* Exam Management
* Announcement
* Class Chat
* AI Chatbot

---

## Định hướng phát triển

* Tối ưu trải nghiệm người dùng
* Hỗ trợ giao diện responsive trên thiết bị di động
* Nâng cấp chatbot AI theo ngữ cảnh người dùng
* Cải thiện khả năng quản lý và theo dõi học tập
* Tích hợp thêm các công cụ hỗ trợ học tập thông minh

---

## Tác giả

Dự án được phát triển phục vụ mục đích học tập, nghiên cứu và thực hành xây dựng hệ thống học tập trực tuyến.
