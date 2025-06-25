import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, IconButton,
  Button, TextField, MenuItem, FormControl, InputLabel, Select, Checkbox
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import FacultySidebar from '../../components/FacultySidebar';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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

// Helper to check if selected time slots are contiguous
function areTimeSlotsContiguous(selected, slots) {
  if (!selected.length) return true;
  const indices = selected.map(s => slots.indexOf(s)).sort((a, b) => a - b);
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) return false;
  }
  return true;
}

const timeSlots = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
];

const FacultySchedule = () => {
  const { user } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [editFields, setEditFields] = useState({ date: '', time: '', title: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [questions, setQuestions] = useState([]); // For selected course
  const [batches, setBatches] = useState([]); // For selected course
  const [addFields, setAddFields] = useState({ date: '', time: '', title: '', description: '', course: '', type: '', questions: [], batches: [] });
  const [courses, setCourses] = useState([]);

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

  // Fetch courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/question-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
      }
    };
    fetchCourses();
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

  // Get events for selected day, grouped by time
  const eventsForSelectedDay = (() => {
    if (!selectedDay) return [];
    const key = selectedDay.toISOString().slice(0, 10);
    const events = eventsByDay[key] || [];
    // Group by time
    const byTime = {};
    events.forEach(ev => {
      if (!byTime[ev.time]) byTime[ev.time] = [];
      byTime[ev.time].push(ev);
    });
    return Object.entries(byTime).sort();
  })();

  // Open edit dialog
  const handleEditOpen = (ev) => {
    setEditEvent(ev);
    setEditFields({
      date: ev.date ? ev.date.slice(0, 10) : '',
      time: ev.time || '',
      title: ev.title || '',
      description: ev.description || ''
    });
    setEditDialog(true);
  };

  // Save edit
  const handleEditSave = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/faculty/tests/${editEvent._id}`,
        { date: editFields.date, time: Array.isArray(editFields.time) ? editFields.time.join(', ') : editFields.time, title: editFields.title, description: editFields.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditDialog(false);
      setEditEvent(null);
      setActionLoading(false);
      // Refresh schedule
      const res = await axios.get('/api/faculty/schedule', { headers: { Authorization: `Bearer ${token}` } });
      setSchedule(res.data || []);
    } catch {
      setActionLoading(false);
    }
  };

  // Delete event
  const handleDelete = async (ev) => {
    if (!window.confirm('Delete this event?')) return;
    setActionLoading(true);
    const token = localStorage.getItem('token');
    let scheduleError = null;
    // Always try deleting from schedule first
    try {
      await axios.delete(`/api/faculty/schedule/${ev._id}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      scheduleError = err;
    }
    // If event has a testId, try deleting from tests (optional, for cleanup)
    if (ev.testId) {
      try {
        await axios.delete(`/api/faculty/tests/${ev.testId}`, { headers: { Authorization: `Bearer ${token}` } });
      } catch {}
    }
    setActionLoading(false);
    // Refresh schedule
    try {
      const res = await axios.get('/api/faculty/schedule', { headers: { Authorization: `Bearer ${token}` } });
      setSchedule(res.data || []);
    } catch {}
    // Only show error if schedule deletion failed
    if (scheduleError) {
      alert('Failed to delete event.');
    }
  };

  // Fetch questions and batches when course changes in add dialog
  useEffect(() => {
    if (!addDialog || !addFields.course) { setQuestions([]); setBatches([]); return; }
    const fetchQuestionsAndBatches = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/faculty/questions?course=${addFields.course}&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(res.data.questions || []);
        const batchRes = await axios.get(`/api/faculty/course-batches?course=${addFields.course}`,
          { headers: { Authorization: `Bearer ${token}` } });
        setBatches(batchRes.data.batches || []);
      } catch {
        setQuestions([]); setBatches([]);
      }
    };
    fetchQuestionsAndBatches();
  }, [addFields.course, addDialog]);

  // Reset add dialog state on close
  useEffect(() => {
    if (!addDialog) {
      setQuestions([]);
      setBatches([]);
      setAddFields({ date: '', time: '', title: '', description: '', course: '', type: '', questions: [], batches: [] });
    }
  }, [addDialog]);

  // Add new event (now creates test and schedules it)
  const handleAddSave = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Create test (with all params)
      await axios.post('/api/faculty/tests', {
        name: addFields.title,
        course: addFields.course,
        questions: addFields.questions,
        date: addFields.date,
        time: Array.isArray(addFields.time) ? addFields.time.join(', ') : addFields.time,
        type: addFields.type,
        batches: addFields.batches
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Add to schedule automatically
      await axios.post('/api/faculty/schedule', {
        course: addFields.course,
        date: addFields.date,
        time: Array.isArray(addFields.time) ? addFields.time.join(', ') : addFields.time,
        type: addFields.type,
        title: addFields.title,
        description: addFields.description,
        batches: addFields.batches
      }, { headers: { Authorization: `Bearer ${token}` } });
      setAddDialog(false);
      setActionLoading(false);
      setAddFields({ date: '', time: '', title: '', description: '', course: '', type: '', questions: [], batches: [] });
      // Refresh schedule
      const res = await axios.get('/api/faculty/schedule', { headers: { Authorization: `Bearer ${token}` } });
      setSchedule(res.data || []);
    } catch {
      setActionLoading(false);
    }
  };

  // When a day is clicked, open the add dialog with the date pre-filled
  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      {/* <Header title="Faculty - Schedule" /> */}
      <FacultySidebar facultyName={user?.name} />
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
                <Box>
                  <IconButton onClick={() => handleMonthChange(1)}><span>&gt;</span></IconButton>
                </Box>
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
                      onClick={() => handleDayClick(day)}
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
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setAddFields(f => ({ ...f, date: selectedDay.toISOString().slice(0, 10) }));
                        setAddDialog(true);
                      }}
                    >
                      Add Test/Event
                    </Button>
                  </Box>
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
                          <ListItem key={time} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 600 }}>{time}</Typography>}
                              secondary={
                                <Box>
                                  {evs.map((ev, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <Typography sx={{
                                        bgcolor: ev.type === 'lab' ? '#6366f1' : ev.type === 'evaluation' ? '#f59e42' : '#38bdf8',
                                        color: '#fff',
                                        borderRadius: 1,
                                        px: 0.7,
                                        py: 0.2,
                                        fontWeight: 500,
                                        display: 'inline-block',
                                        mr: 1
                                      }}>
                                        {ev.course?.name || ev.type} ({ev.type})
                                      </Typography>
                                      <IconButton size="small" onClick={() => handleEditOpen(ev)}><EditIcon fontSize="small" /></IconButton>
                                      <IconButton size="small" onClick={() => handleDelete(ev)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
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
              {/* Add Event Dialog */}
              <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Add Test/Event</DialogTitle>
                <DialogContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                      label="Date"
                      type="date"
                      value={addFields.date}
                      onChange={e => setAddFields(f => ({ ...f, date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel id="time-label">Time Slot(s)</InputLabel>
                      <Select
                        labelId="time-label"
                        multiple
                        value={addFields.time ? (Array.isArray(addFields.time) ? addFields.time : [addFields.time]) : []}
                        onChange={e => {
                          const value = e.target.value;
                          if (areTimeSlotsContiguous(value, timeSlots)) {
                            setAddFields(f => ({ ...f, time: value }));
                          }
                        }}
                        renderValue={selected => selected.join(', ')}
                        label="Time Slot(s)"
                      >
                        {timeSlots.map(slot => (
                          <MenuItem key={slot} value={slot}>
                            <Checkbox checked={addFields.time && addFields.time.includes(slot)} />
                            <ListItemText primary={slot} />
                          </MenuItem>
                        ))}
                      </Select>
                      {addFields.time && !areTimeSlotsContiguous(addFields.time, timeSlots) && (
                        <Typography color="error" variant="caption">Time slots must be contiguous.</Typography>
                      )}
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="course-label">Course</InputLabel>
                      <Select
                        labelId="course-label"
                        value={addFields.course}
                        label="Course"
                        onChange={e => setAddFields(f => ({ ...f, course: e.target.value, questions: [], batches: [] }))}
                      >
                        {courses.map(c => (
                          <MenuItem key={c._id} value={c._id}>{c.name} ({c.code})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="type-label">Type</InputLabel>
                      <Select
                        labelId="type-label"
                        value={addFields.type}
                        label="Type"
                        onChange={e => setAddFields(f => ({ ...f, type: e.target.value }))}
                      >
                        <MenuItem value="test">Test</MenuItem>
                        <MenuItem value="lab">Lab</MenuItem>
                        <MenuItem value="evaluation">Evaluation</MenuItem>
                        <MenuItem value="exercise">Exercise</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Title"
                      value={addFields.title}
                      onChange={e => setAddFields(f => ({ ...f, title: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      value={addFields.description}
                      onChange={e => setAddFields(f => ({ ...f, description: e.target.value }))}
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel id="questions-label">Select Questions</InputLabel>
                      <Select
                        labelId="questions-label"
                        multiple
                        value={addFields.questions}
                        onChange={e => setAddFields(f => ({ ...f, questions: e.target.value }))}
                        renderValue={selected => selected.map(id => {
                          const q = questions.find(q => q._id === id);
                          return q ? q.title : id;
                        }).join(', ')}
                      >
                        {questions.map(q => (
                          <MenuItem key={q._id} value={q._id}>
                            <Checkbox checked={addFields.questions.includes(q._id)} />
                            <ListItemText primary={q.title} secondary={q.description} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="batch-label">Select Batch(es)</InputLabel>
                      <Select
                        labelId="batch-label"
                        multiple
                        value={addFields.batches}
                        onChange={e => setAddFields(f => ({ ...f, batches: e.target.value }))}
                        renderValue={selected => selected.join(', ')}
                      >
                        {batches.map(batch => (
                          <MenuItem key={batch} value={batch}>
                            <Checkbox checked={addFields.batches.includes(batch)} />
                            <ListItemText primary={batch} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button onClick={() => setAddDialog(false)} disabled={actionLoading}>Cancel</Button>
                      <Button variant="contained" onClick={handleAddSave} disabled={actionLoading}>Add</Button>
                    </Box>
                  </Box>
                </DialogContent>
              </Dialog>
              {/* Edit Event Dialog */}
              <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                      label="Date"
                      type="date"
                      value={editFields.date}
                      onChange={e => setEditFields(f => ({ ...f, date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <FormControl fullWidth>
                      <InputLabel id="edit-time-label">Time Slot(s)</InputLabel>
                      <Select
                        labelId="edit-time-label"
                        multiple
                        value={editFields.time ? (Array.isArray(editFields.time) ? editFields.time : editFields.time.split(', ')) : []}
                        onChange={e => {
                          const value = e.target.value;
                          if (areTimeSlotsContiguous(value, timeSlots)) {
                            setEditFields(f => ({ ...f, time: value }));
                          }
                        }}
                        renderValue={selected => selected.join(', ')}
                        label="Time Slot(s)"
                      >
                        {timeSlots.map(slot => (
                          <MenuItem key={slot} value={slot}>
                            <Checkbox checked={editFields.time && (Array.isArray(editFields.time) ? editFields.time : editFields.time.split(', ')).includes(slot)} />
                            <ListItemText primary={slot} />
                          </MenuItem>
                        ))}
                      </Select>
                      {editFields.time && !areTimeSlotsContiguous(Array.isArray(editFields.time) ? editFields.time : editFields.time.split(', '), timeSlots) && (
                        <Typography color="error" variant="caption">Time slots must be contiguous.</Typography>
                      )}
                    </FormControl>
                    <TextField
                      label="Title"
                      value={editFields.title}
                      onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      value={editFields.description}
                      onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))}
                      fullWidth
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button onClick={() => setEditDialog(false)} disabled={actionLoading}>Cancel</Button>
                      <Button variant="contained" onClick={handleEditSave} disabled={actionLoading}>Save</Button>
                    </Box>
                  </Box>
                </DialogContent>
              </Dialog>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultySchedule;
