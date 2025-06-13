import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminServerLogs from './pages/AdminServerLogs';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import FacultyEvaluations from './pages/faculty/FacultyEvaluations';
import FacultyStudents from './pages/faculty/FacultyStudents';
import FacultySchedule from './pages/faculty/FacultySchedule';
import FacultyQuestionPool from './pages/faculty/FacultyQuestionPool';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/faculty" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/user-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/admin/server-logs" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminServerLogs />
            </ProtectedRoute>
          } />

          <Route path="/faculty/evaluations" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyEvaluations />
            </ProtectedRoute>
          } />

          <Route path="/faculty/students" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyStudents />
            </ProtectedRoute>
          } />

          <Route path="/faculty/schedule" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultySchedule />
            </ProtectedRoute>
          } />

          <Route path="/faculty/question-pool" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyQuestionPool />
            </ProtectedRoute>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
