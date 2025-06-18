import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, IconButton
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import StudentSidebar from '../../components/StudentSidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

// Helper to get all days in a month
function getDaysInMonth(year, month) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const StudentSchedule = () => {
  const { user } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/schedule', {
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

  // Group events by date string "YYYY-MM-DD"
  const eventsByDay = {};
  schedule.forEach(ev => {
    if (!ev.date) return;
    const d = new Date(ev.date);
    const key = d.toISOString().slice(0, 10);
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(ev);
  });

  const days = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0=Sun
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // For calendar grid: pad with empty cells if month doesn't start on Sunday
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  days.forEach(day => calendarCells.push(day));

  // Handle previous/next month
  const handleMonthChange = (delta) => {
    setCurrentMonth(prev => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m + delta, 1);
    });
    setSelectedDay(null);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Student - Schedule" />
      <StudentSidebar studentName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthIcon sx={{ mr: 1 }} /> My Schedule
        </Typography>
        <Paper sx={{
          p: 3,
          borderRadius: 3,
          mt: 2,
          background: 'rgba(255,255,255,0.13)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
          overflowX: 'auto'
        }}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <IconButton onClick={() => handleMonthChange(-1)}><span>&lt;</span></IconButton>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Typography>
                <IconButton onClick={() => handleMonthChange(1)}><span>&gt;</span></IconButton>
              </Box>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                background: 'rgba(0,0,0,0.03)',
                borderRadius: 2,
                p: 1
              }}>
                {weekDays.map(day => (
                  <Box
                    key={day}
                    sx={{
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#3730a3', // indigo-800, dark blue/violet shade
                      pb: 1
                    }}
                  >
                    {day}
                  </Box>
                ))}
                {calendarCells.map((day, idx) => {
                  if (!day) return <Box key={idx} />;
                  const key = day.toISOString().slice(0, 10);
                  const hasEvents = !!eventsByDay[key];
                  const isToday = key === new Date().toISOString().slice(0, 10);
                  return (
                    <Box
                      key={key}
                      sx={{
                        minHeight: 70,
                        borderRadius: 2,
                        bgcolor: isToday ? 'rgba(99,102,241,0.13)' : 'transparent',
                        border: isToday ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.07)',
                        boxShadow: hasEvents ? 2 : 0,
                        cursor: 'pointer',
                        p: 1,
                        transition: 'background 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          background: 'rgba(99,102,241,0.09)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => setSelectedDay(day)}
                    >
                      <Typography sx={{ fontWeight: 600, color: isToday ? '#6366f1' : '#222' }}>
                        {day.getDate()}
                      </Typography>
                      {hasEvents && (
                        <Box sx={{ mt: 0.5 }}>
                          {(eventsByDay[key] || []).slice(0, 2).map((ev, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              sx={{
                                display: 'block',
                                bgcolor: ev.type === 'lab' ? '#6366f1' : ev.type === 'evaluation' ? '#f59e42' : '#38bdf8',
                                color: '#fff',
                                borderRadius: 1,
                                px: 0.5,
                                mb: 0.3,
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {ev.course?.name || ev.type}
                            </Typography>
                          ))}
                          {eventsByDay[key].length > 2 && (
                            <Typography variant="caption" sx={{ color: '#6366f1' }}>
                              +{eventsByDay[key].length - 2} more
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
              <Dialog open={!!selectedDay} onClose={() => setSelectedDay(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {selectedDay &&
                    `${selectedDay.getDate().toString().padStart(2, '0')}/${
                      (selectedDay.getMonth() + 1).toString().padStart(2, '0')
                    }/${selectedDay.getFullYear()}`
                  }
                  <IconButton onClick={() => setSelectedDay(null)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                  {selectedDay && (() => {
                    const key = selectedDay.toISOString().slice(0, 10);
                    const events = eventsByDay[key] || [];
                    if (events.length === 0) return <Typography>No events scheduled.</Typography>;
                    // Group by time
                    const byTime = {};
                    events.forEach(ev => {
                      if (!byTime[ev.time]) byTime[ev.time] = [];
                      byTime[ev.time].push(ev);
                    });
                    return (
                      <List>
                        {Object.entries(byTime).sort().map(([time, evs]) => (
                          <ListItem key={time} alignItems="flex-start">
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 600 }}>{time}</Typography>}
                              secondary={
                                <Box>
                                  {evs.map((ev, idx) => (
                                    <Typography key={idx} sx={{
                                      bgcolor: ev.type === 'lab' ? '#6366f1' : ev.type === 'evaluation' ? '#f59e42' : '#38bdf8',
                                      color: '#fff',
                                      borderRadius: 1,
                                      px: 0.7,
                                      py: 0.2,
                                      fontWeight: 500,
                                      display: 'inline-block',
                                      mr: 1,
                                      mb: 0.5
                                    }}>
                                      {ev.course?.name || ev.type} ({ev.type})
                                    </Typography>
                                  ))}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    );
                  })()}
                </DialogContent>
              </Dialog>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default StudentSchedule;
