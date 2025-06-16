import React, { useContext, useEffect, useState } from 'react';
import { Box, Toolbar, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import StudentSidebar from '../../components/StudentSidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ tests: 0, avg: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data || { tests: 0, avg: 0 });
      } catch {
        setStats({ tests: 0, avg: 0 });
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, padding: 0 }}>
      <Header title="Lab Evaluation System - Student" />
      <StudentSidebar studentName={user?.name || 'Student'} />
      <Box component="main" sx={{
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
        background: 'linear-gradient(135deg, #282f2f, #becdcd)',
      }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom color="white">
            Student Dashboard
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={8} sx={{
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: 3,
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                  p: { xs: 3, sm: 5 },
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#222',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.01)' },
                }}>
                  <Typography variant="h6">Total Tests</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>{stats.tests}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={8} sx={{
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: 3,
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                  p: { xs: 3, sm: 5 },
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#222',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.01)' },
                }}>
                  <Typography variant="h6">Average Score</Typography>
                  <Typography variant="h4" sx={{ mt: 1 }}>{stats.avg}</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
