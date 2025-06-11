# Lab Evaluation System

This project is a full-stack Lab Evaluation System for DCSE, supporting user authentication, server log tracking, and admin management features.

## Features

- User authentication (admin, faculty, student)
- Prevents multiple simultaneous sessions per user
- Tracks login attempts, including IP and system/device info
- Server logs with filtering, searching, and download (CSV, JSON, Excel, PDF)
- Admin can delete logs with confirmation
- Real-time log updates in the admin panel (auto-refresh every 5 seconds)
- Responsive, modern UI with Material-UI

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/lab-evaluation-system.git
   cd lab-evaluation-system
   ```

2. **Backend setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file with your MongoDB URI and JWT secret
   cp .env.example .env
   npm start
   ```

3. **Frontend setup:**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```

4. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## Usage

- **Admin Panel:** View, filter, download, and delete server logs. Logs auto-refresh every 5 seconds for real-time updates.
- **Login Security:** Only one active session per user is allowed. If a user logs in elsewhere, the previous session is invalidated.
- **Log Tracking:** All login attempts (success or failure) are logged with user ID, IP, and system info.

## Customization

- **Polling Interval:** To change the log auto-refresh rate, edit the interval in `frontend/src/pages/AdminServerLogs.jsx` (default: 5000ms).
- **Session Policy:** To allow multiple sessions per user, adjust the session token logic in `backend/routes/auth.js`.

## Contributing

Pull requests are welcome! For major changes, please open an issue first.


