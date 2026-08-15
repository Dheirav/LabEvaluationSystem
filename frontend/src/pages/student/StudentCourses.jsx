import React, { useEffect, useState, useContext } from 'react';
import axios from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import StudentSidebar from '../../components/StudentSidebar';
import Header from '../../components/Header';
import LoadingScreen from '../../components/LoadingScreen';
import './StudentCourses.css';

const StudentCourses = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`/student/courses`);
        setCourses(res.data);
      } catch (err) {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="student-dashboard">
      <StudentSidebar />
      <div className="main-content">
        <Header title="My Courses" />
        <div className="courses-list">
          {courses.length === 0 ? (
            <div className="no-courses">No courses assigned.</div>
          ) : (
            <ul>
              {courses.map((course) => (
                <li key={course._id} className="course-item">
                  <div className="course-name">{course.name}</div>
                  <div className="course-code">{course.code}</div>
                  <div className="course-semester">Semester: {course.semester}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCourses;
