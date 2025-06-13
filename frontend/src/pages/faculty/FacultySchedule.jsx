import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FacultySchedule = () => {
  const { user } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/schedule', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSchedule(res.data || []);
      } catch {
        setSchedule([]);
        setError('Failed to fetch schedule');
      }
      setLoading(false);
    };
    fetchSchedule();
  }, []);

  // Group by date for a calendar-like effect
  const grouped = schedule.reduce((acc, item) => {
    const date = item.date ? new Date(item.date).toLocaleDateString() : 'Unknown';
    acc[date] = acc[date] || [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Faculty - Schedule" />
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">My Schedule</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            Object.keys(grouped).length === 0 ? (
              <Typography>No schedule found</Typography>
            ) : (
              Object.entries(grouped).map(([date, items]) => (
                <Box key={date} sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>{date}</Typography>
                  <List>
                    {items.map((item, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={`${item.time || ''} - ${item.course?.name || ''}`}
                          secondary={item.type}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))
            )
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultySchedule;
