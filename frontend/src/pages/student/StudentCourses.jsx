import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, CircularProgress, Button } from '@mui/material';
import StudentSidebar from '../../components/StudentSidebar';
import { AuthContext } from '../../context/AuthContext'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentCourses = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data || []);
      } catch (err) {
        setCourses([]);
        setError('Failed to fetch assigned courses');
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <StudentSidebar studentName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">My Assigned Courses</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2, mb: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center">{error}</Typography>
          ) : courses.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 8 }}>
              No assigned courses found.
            </Typography>
          ) : (
            <List>
              {courses.map((course) => (
                <ListItem key={course._id} sx={{ borderBottom: '1px solid #e0e0e0' }}
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/student/courses/${course._id}/modules`)}
                    >
                      View Modules
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <span style={{ color: '#222', fontWeight: 500 }}>
                        {course.name} <span style={{ color: '#90caf9' }}>({course.code})</span>
                      </span>
                    }
                    secondary={
                      <span style={{ color: '#607d8b' }}>
                        Semester: {course.semester}
                      </span>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default StudentCourses;
