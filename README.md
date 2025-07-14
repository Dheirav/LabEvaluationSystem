# Lab Evaluation System

A full-stack web application for managing laboratory evaluations and user registrations in an educational setting.

## Features

### User Management
  - Register single users with roles (student/faculty)
  - Real-time form validation
  - Secure password handling
  - Role-based access control

  - Upload users in bulk via file upload
  - Supported formats: XLSX, XLS, CSV, JSON, PDF
  - Batch processing with error handling
  - Progress tracking and status reporting
  - See [Sample Bulk User JSON](frontend/public/sample_users_bulk.json) for example format and fields used in the system.
  - **Sample JSON Format:**
    ```json
    [
      { "name": "Admin User", "user_id": "1", "roll_number": "A0001", "password": "1", "role": "admin" },
      { "name": "Faculty One", "user_id": "2", "roll_number": "F0002", "password": "2", "role": "faculty" },
      { "name": "Faculty Two", "user_id": "3", "roll_number": "F0003", "password": "3", "role": "faculty" },
      { "name": "Faculty Three", "user_id": "4", "roll_number": "F0004", "password": "4", "role": "faculty" },
      { "name": "Faculty Four", "user_id": "5", "roll_number": "F0005", "password": "5", "role": "faculty" },
      { "name": "Student N1", "user_id": "6", "roll_number": "S0006", "password": "6", "role": "student", "batch": "N", "semester": 1 },
      { "name": "Student N2", "user_id": "7", "roll_number": "S0007", "password": "7", "role": "student", "batch": "N", "semester": 2 },
      { "name": "Student N3", "user_id": "8", "roll_number": "S0008", "password": "8", "role": "student", "batch": "N", "semester": 3 },
      { "name": "Student N4", "user_id": "9", "roll_number": "S0009", "password": "9", "role": "student", "batch": "N", "semester": 4 },
      { "name": "Student P1", "user_id": "10", "roll_number": "S0010", "password": "10", "role": "student", "batch": "P", "semester": 1 },
      { "name": "Student P2", "user_id": "11", "roll_number": "S0011", "password": "11", "role": "student", "batch": "P", "semester": 2 },
      { "name": "Student P3", "user_id": "12", "roll_number": "S0012", "password": "12", "role": "student", "batch": "P", "semester": 3 },
      { "name": "Student P4", "user_id": "13", "roll_number": "S0013", "password": "13", "role": "student", "batch": "P", "semester": 4 },
      { "name": "Student Q1", "user_id": "14", "roll_number": "S0014", "password": "14", "role": "student", "batch": "Q", "semester": 1 },
      { "name": "Student Q2", "user_id": "15", "roll_number": "S0015", "password": "15", "role": "student", "batch": "Q", "semester": 2 },
      { "name": "Student Q3", "user_id": "16", "roll_number": "S0016", "password": "16", "role": "student", "batch": "Q", "semester": 3 },
      { "name": "Student Q4", "user_id": "17", "roll_number": "S0017", "password": "17", "role": "student", "batch": "Q", "semester": 4 },
      { "name": "Student N5", "user_id": "18", "roll_number": "S0018", "password": "18", "role": "student", "batch": "N", "semester": 1 },
      { "name": "Student P5", "user_id": "19", "roll_number": "S0019", "password": "19", "role": "student", "batch": "P", "semester": 2 },
      { "name": "Student Q5", "user_id": "20", "roll_number": "S0020", "password": "20", "role": "student", "batch": "Q", "semester": 3 }
    ]
    ```
  - **Fields:**
    - `name`: Full name of the user
    - `user_id`: Unique identifier
    - `roll_number`: Roll number (for students/faculty/admin)
    - `password`: Initial password (should be changed on first login)
    - `role`: Role of the user (`admin`, `faculty`, `student`)
    - `batch`: Student batch (if applicable)
    - `semester`: Student semester (if applicable)

### Authentication

### Course, Batch, and Semester Management
- Create, update, and assign courses to faculty and students
- Manage batches and semesters for students
- Assign faculty to specific courses and batches
## Technology Stack
### Lab Manual & Material Management
- Upload, manage, and filter lab manuals/materials by course, batch, and assigned faculty
- Supported upload formats: PDF, DOCX, XLSX, CSV, JSON
- Download and view materials from the dashboard

### Attendance Tracking
- Mark and view attendance for students by course, batch, and semester
- Admin and faculty dashboards for attendance analytics
- Material UI tables with sorting and pagination
### Frontend
### Evaluation & Test Management
- Create, schedule, and manage lab evaluations/tests
- Question pool management for faculty
- Student dashboard for test access and results
- React.js
### Server Logs & Action Logging
- All actions (login, upload, attendance, CRUD) are logged with IP address and system info
- Admin dashboard for viewing server logs and user actions
- Material-UI (MUI) components
### Session Logic
- When a student logs in, the oldest session is closed and only the newest session remains active
- Forced logout on other devices if session is invalid
- Authentication middleware checks session validity
- Axios for API calls
### Dashboards
- Role-based dashboards for admin, faculty, and students
- Analytics, attendance, course management, and logs
- React Router for navigation

### Backend
- Node.js

## Project Structure
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   └── AdminSidebar.jsx
│   │   ├── pages/
│   │   │   └── UserRegistration.jsx
│   │   └── App.css
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   └── package.json
│
└── README.md
```

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Lab_Evaluation_System.git
cd Lab_Evaluation_System
```
## Workflows

### Admin Workflows
- Register users (individual/bulk)
- Manage courses, batches, and faculty assignments
- View and download server logs
- Monitor attendance and evaluation analytics

### Faculty Workflows
- View assigned courses and batches
- Upload and manage lab manuals/materials
- Create and manage evaluations/tests
- Mark and view attendance

### Student Workflows
- View assigned courses, batches, and lab materials
- Attempt evaluations/tests
- View attendance and results

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Start the backend server:
```bash
cd backend
npm start
```

5. Start the frontend development server:
```bash
cd frontend
npm start
```

## API Documentation

### Authentication Routes

#### Individual Registration
```http
POST /api/auth/register/individual
Content-Type: application/json

{
  "name": "John Doe",
  "user_id": "STU001",
  "password": "secure123",
  "role": "student"
}
```

#### Bulk Registration
```http
POST /api/auth/register/bulk
Content-Type: multipart/form-data

file: [upload file]
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "user_id": "STU001",
  "password": "secure123"
}
```

## Bulk Upload File Formats

### JSON Format
```json
{
  "users": [
    {
      "name": "John Doe",
### Course Management
```http
GET /api/courses
GET /api/courses/:id
POST /api/courses
PUT /api/courses/:id
DELETE /api/courses/:id
```

### Lab Manual & Material Endpoints
```http
GET /api/labmanuals?course=COURSE_ID&batch=BATCH_ID&faculty=FACULTY_ID
POST /api/labmanuals/upload
```

### Attendance Endpoints
```http
GET /api/attendance?course=COURSE_ID&batch=BATCH_ID&semester=SEMESTER
POST /api/attendance/mark
```

### Evaluation & Test Endpoints
```http
GET /api/evaluations?course=COURSE_ID&batch=BATCH_ID
POST /api/evaluations/create
GET /api/questions/pool?faculty=FACULTY_ID
```

### Server Log Endpoints
```http
GET /api/logs
```
      "user_id": "STU001",
      "password": "pass123",
      "role": "student"
    },
    {
      "name": "Jane Smith",
      "user_id": "FAC001",
      "password": "pass456",
      "role": "faculty"
    }
  ]
}
```

### CSV Format
```csv
name,user_id,password,role
John Doe,STU001,pass123,student
Jane Smith,FAC001,pass456,faculty
```

## Environment Variables

Create `.env` files in both frontend and backend directories:

```env
# Backend .env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lab_eval
JWT_SECRET=your_jwt_secret
### Internal JSON Format Example
```json
[
  { "name": "Admin User", "user_id": "1", "roll_number": "A0001", "password": "1", "role": "admin" },
  { "name": "Faculty One", "user_id": "2", "roll_number": "F0002", "password": "2", "role": "faculty" },
  { "name": "Faculty Two", "user_id": "3", "roll_number": "F0003", "password": "3", "role": "faculty" },
  { "name": "Faculty Three", "user_id": "4", "roll_number": "F0004", "password": "4", "role": "faculty" },
  { "name": "Faculty Four", "user_id": "5", "roll_number": "F0005", "password": "5", "role": "faculty" },
  { "name": "Student N1", "user_id": "6", "roll_number": "S0006", "password": "6", "role": "student", "batch": "N", "semester": 1 },
  { "name": "Student N2", "user_id": "7", "roll_number": "S0007", "password": "7", "role": "student", "batch": "N", "semester": 2 },
  { "name": "Student N3", "user_id": "8", "roll_number": "S0008", "password": "8", "role": "student", "batch": "N", "semester": 3 },
  { "name": "Student N4", "user_id": "9", "roll_number": "S0009", "password": "9", "role": "student", "batch": "N", "semester": 4 },
  { "name": "Student P1", "user_id": "10", "roll_number": "S0010", "password": "10", "role": "student", "batch": "P", "semester": 1 },
  { "name": "Student P2", "user_id": "11", "roll_number": "S0011", "password": "11", "role": "student", "batch": "P", "semester": 2 },
  { "name": "Student P3", "user_id": "12", "roll_number": "S0012", "password": "12", "role": "student", "batch": "P", "semester": 3 },
  { "name": "Student P4", "user_id": "13", "roll_number": "S0013", "password": "13", "role": "student", "batch": "P", "semester": 4 },
  { "name": "Student Q1", "user_id": "14", "roll_number": "S0014", "password": "14", "role": "student", "batch": "Q", "semester": 1 },
  { "name": "Student Q2", "user_id": "15", "roll_number": "S0015", "password": "15", "role": "student", "batch": "Q", "semester": 2 },
  { "name": "Student Q3", "user_id": "16", "roll_number": "S0016", "password": "16", "role": "student", "batch": "Q", "semester": 3 },
  { "name": "Student Q4", "user_id": "17", "roll_number": "S0017", "password": "17", "role": "student", "batch": "Q", "semester": 4 },
  { "name": "Student N5", "user_id": "18", "roll_number": "S0018", "password": "18", "role": "student", "batch": "N", "semester": 1 },
  { "name": "Student P5", "user_id": "19", "roll_number": "S0019", "password": "19", "role": "student", "batch": "P", "semester": 2 },
  { "name": "Student Q5", "user_id": "20", "roll_number": "S0020", "password": "20", "role": "student", "batch": "Q", "semester": 3 }
]
```

# Frontend .env
REACT_APP_API_URL=http://localhost:5000/api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
