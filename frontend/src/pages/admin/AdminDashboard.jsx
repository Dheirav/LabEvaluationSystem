import React, { useEffect, useState } from 'react';
import { Box, Toolbar, Typography, Grid, Paper } from '@mui/material';
import AdminSidebar from '../../components/AdminSidebar';
import Header from '../../components/Header';
import LineChart from '../../components/Linechart'
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/admin/user-stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setStats(res.data);
      } catch (err) {
        setStats(null);
      }
    };
    fetchStats();
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);
  if (!stats) return <div>Loading stats...</div>;
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
      <Header title="Lab Evaluation System - Admin" />
      <AdminSidebar />
      
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
            Dashboard Overview
          </Typography>
          <Grid 
            container 
            spacing={3}
          >
            {/* Students Card */}
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
                <Typography variant="h6">Students</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{stats.students}</Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Active: {stats.activeStudents }
                </Typography>
              </Paper>
            </Grid>

            {/* Faculty Card */}
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
                <Typography variant="h6">Faculty</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{stats.faculty}</Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Active: {stats.activeFaculty}
                </Typography>
              </Paper>
            </Grid>

            {/* Admins Card */}
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
                <Typography variant="h6">Admins</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{stats.admins}</Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Active: {stats.activeAdmins}
                </Typography>
              </Paper>
            </Grid>

            {/* Chart Card */}
            <Grid item xs={12}>
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
                <Typography variant="h6" gutterBottom>
                  Evaluation Submissions
                </Typography>
                <LineChart />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;