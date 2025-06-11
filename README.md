# Lab Evaluation System

A full-stack web application for managing laboratory evaluations and user registrations in an educational setting.

## Features

### User Management
- **Individual User Registration**
  - Register single users with roles (student/faculty)
  - Real-time form validation
  - Secure password handling
  - Role-based access control

- **Bulk User Registration**
  - Upload users in bulk via file upload
  - Supported formats: XLSX, XLS, CSV, JSON, PDF
  - Batch processing with error handling
  - Progress tracking and status reporting

### Authentication
- Secure login system
- JWT-based authentication
- Role-based authorization
- Session management

## Technology Stack

### Frontend
- React.js
- Material-UI (MUI) components
- Axios for API calls
- React Router for navigation

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Multer for file uploads
- JWT for authentication

## Project Structure

```
Lab_Evaluation_System/
├── frontend/
│   ├── src/
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

# Frontend .env
REACT_APP_API_URL=http://localhost:5000/api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
