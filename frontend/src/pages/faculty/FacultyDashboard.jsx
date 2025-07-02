import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FacultyDashboard = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // Use the correct endpoint for assigned courses & batches
        const res = await axios.get('/api/auth/faculty/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data || []);
      } catch (err) {
        setCourses([]);
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Faculty Dashboard" />
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #23272f 80%, #3a4457 100%)',
            borderRadius: 4,
            p: { xs: 2, sm: 4 },
            mb: 3,
            boxShadow: 3,
            color: 'white',
            maxWidth: 600,
            mx: 'auto',
            mt: 8 // <-- add margin-top to push the box down
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white' }}>
            My Courses
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ color: '#b0bec5', fontWeight: 500 }}>
            Assigned Courses & Batches
          </Typography>
          {loading ? (
            <CircularProgress sx={{ color: 'white' }} />
          ) : (
            <List>
              {courses.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No assigned courses." sx={{ color: '#b0bec5' }} />
                </ListItem>
              ) : (
                courses.map((c) => (
                  <ListItem key={c._id} sx={{ borderBottom: '1px solid #374151' }}>
                    <ListItemText
                      primary={
                        <span style={{ color: '#fff', fontWeight: 500 }}>
                          {c.name} <span style={{ color: '#90caf9' }}>({c.code})</span>
                        </span>
                      }
                      secondary={
                        <span style={{ color: '#b0bec5' }}>
                          Batches: {(c.batches || []).join(', ')}
                        </span>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FacultyDashboard;