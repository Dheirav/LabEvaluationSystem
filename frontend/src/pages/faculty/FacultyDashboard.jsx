import React, { useContext, useEffect, useState } from 'react';
import { Box, Toolbar, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

export default function FacultyDashboard() {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [coursesRes, evalsRes] = await Promise.all([
          axios.get('/api/faculty/courses', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/faculty/evaluations', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setCourses(coursesRes.data || []);
        setPending((evalsRes.data || []).filter(e => e.status === 'pending').length);
      } catch {
        setCourses([]);
        setPending(0);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  return (
    <Box 
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
      }}
    >
      <Header title="Lab Evaluation System - Faculty" />
      <FacultySidebar facultyName={user?.name || 'Faculty'} />
      <Box 
        component="main" 
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          background: 'linear-gradient(135deg, #282f2f, #becdcd)',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="h4" 
            gutterBottom
            color="white"
          >
            Faculty Dashboard
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={8}
                  sx={{
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255,255,255,0.10)',
                    borderRadius: 3,
                    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                    p: { xs: 3, sm: 5 },
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#222',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.01)'
                    },
                  }}
                >
                  <Typography variant="h6">My Courses</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>{courses.length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  elevation={8}
                  sx={{
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255,255,255,0.10)',
                    borderRadius: 3,
                    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                    p: { xs: 3, sm: 5 },
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#222',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.01)'
                    },
                  }}
                >
                  <Typography variant="h6">Evaluations Pending</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>{pending}</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
}