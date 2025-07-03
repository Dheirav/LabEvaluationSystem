import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminServerLogs from './pages/admin/AdminServerLogs';
import UserManagement from './pages/admin/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import FacultyEvaluations from './pages/faculty/FacultyEvaluations';
import CourseManagement from './pages/admin/CourseManagement';
import FacultyStudents from './pages/faculty/FacultyStudents';
import FacultySchedule from './pages/faculty/FacultySchedule';
import FacultyQuestionPool from './pages/faculty/FacultyQuestionPool';
import FacultyLabManuals from './pages/faculty/FacultyLabManuals';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminStudents from './pages/admin/AdminStudents';
import FacultyReports from './pages/faculty/FacultyReports';
import StudentSchedule from './pages/student/StudentSchedule';
import FacultyCourseAssignment from './pages/admin/FacultyCourseAssignment';
import FacultyTestCreation from './pages/faculty/FacultyTestCreation';
import FacultyTestList from './pages/faculty/FacultyTestList';
import StudentCourses from './pages/student/StudentCourses';
import StudentMaterials from './pages/student/StudentMaterials';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import AdminAttendance from './pages/admin/AdminAttendance';

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

          <Route path="/faculty/lab-manuals" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyLabManuals />
            </ProtectedRoute>
          } />

          <Route path="/admin/faculty" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminFaculty />
            </ProtectedRoute>
          } />

          <Route path="/admin/students" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStudents />
            </ProtectedRoute>
          } />

          <Route path="/admin/course-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CourseManagement />
            </ProtectedRoute>
          } />

          <Route path="/admin/faculty-course-assignment" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FacultyCourseAssignment />
            </ProtectedRoute>
          } />

          <Route path="/faculty/test-creation" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyTestCreation />
            </ProtectedRoute>
          } />
          <Route path="/faculty/tests" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyTestList />
            </ProtectedRoute>
          } />

          <Route path="/student/courses" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentCourses />
            </ProtectedRoute>
          } />

          <Route path="/student/materials" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMaterials />
            </ProtectedRoute>
          } />

          <Route path="/student/schedule" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentSchedule></StudentSchedule>
            </ProtectedRoute>
          } />

          <Route path="/faculty/attendance" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyAttendance />
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAttendance />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
