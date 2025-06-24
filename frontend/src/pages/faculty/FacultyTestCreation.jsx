import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText, OutlinedInput, Chip, CircularProgress
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import FacultySidebar from '../../components/FacultySidebar';

const FacultyTestCreation = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [testName, setTestName] = useState('');
  const [date, setDate] = useState('');
  const [timeWindow, setTimeWindow] = useState([]); // array of selected time slots
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [type, setType] = useState('test'); // 'test' or 'exercise'
  const [batches, setBatches] = useState([]); // New: list of batches for selected course
  const [selectedBatches, setSelectedBatches] = useState([]); // New: selected batches
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/question-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    const fetchQuestionsAndBatches = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // Fetch questions
        const res = await axios.get(`/api/faculty/questions?course=${selectedCourse}&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(res.data.questions || []);
        // Fetch batches for this course
        const batchRes = await axios.get(`/api/faculty/course-batches?course=${selectedCourse}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBatches(batchRes.data.batches || []);
      } catch {
        setQuestions([]);
        setBatches([]);
      }
      setLoading(false);
    };
    fetchQuestionsAndBatches();
  }, [selectedCourse]);

  const handleCreateTest = async () => {
    setError(''); setSuccess('');
    if (!testName || !selectedCourse || selectedQuestions.length === 0 || !date || timeWindow.length === 0 || !type || selectedBatches.length === 0) {
      setError('All fields are required.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/faculty/tests', {
        name: testName,
        course: selectedCourse,
        questions: selectedQuestions,
        date,
        time: timeWindow.join(', '),
        type,
        batches: selectedBatches // New: send selected batches
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Add to schedule automatically
      await axios.post('/api/faculty/schedule', {
        course: selectedCourse,
        date,
        time: timeWindow.join(', '),
        type,
        title: testName,
        testType: type,
        description: `${type === 'test' ? 'Test' : 'Exercise'}: ${testName}`,
        batches: selectedBatches // New: send selected batches
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Test created successfully and scheduled!');
      setTestName(''); setSelectedQuestions([]); setDate(''); setTimeWindow([]); setType('test'); setSelectedBatches([]);
    } catch {
      setError('Failed to create test.');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', pt: 6 }}>
        <Paper sx={{ p: 4, maxWidth: 600, width: '100%' }} elevation={4}>
          <Typography variant="h4" gutterBottom align="center">Create New Test/Exercise</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="course-label">Course</InputLabel>
            <Select
              labelId="course-label"
              value={selectedCourse}
              label="Course"
              onChange={e => setSelectedCourse(e.target.value)}
            >
              {courses.map(course => (
                <MenuItem key={course._id} value={course._id}>{course.name} ({course.code})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="type-label">Type</InputLabel>
            <Select
              labelId="type-label"
              value={type}
              label="Type"
              onChange={e => setType(e.target.value)}
            >
              <MenuItem value="test">Test</MenuItem>
              <MenuItem value="exercise">Exercise</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Test/Exercise Name"
            fullWidth
            sx={{ mb: 2 }}
            value={testName}
            onChange={e => setTestName(e.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="time-window-label">Time Window (Pick one or more)</InputLabel>
            <Select
              labelId="time-window-label"
              multiple
              value={timeWindow}
              onChange={e => setTimeWindow(e.target.value)}
              input={<OutlinedInput label="Time Window" />}
              renderValue={selected => selected.join(', ')}
            >
              {timeSlots.map(slot => (
                <MenuItem key={slot} value={slot}>
                  <Checkbox checked={timeWindow.indexOf(slot) > -1} />
                  <ListItemText primary={slot} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="questions-label">Select Questions</InputLabel>
            <Select
              labelId="questions-label"
              multiple
              value={selectedQuestions}
              onChange={e => setSelectedQuestions(e.target.value)}
              input={<OutlinedInput label="Select Questions" />}
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(id => {
                    const q = questions.find(q => q._id === id);
                    return <Chip key={id} label={q ? q.title : id} />;
                  })}
                </Box>
              )}
            >
              {questions.map(q => (
                <MenuItem key={q._id} value={q._id}>
                  <Checkbox checked={selectedQuestions.indexOf(q._id) > -1} />
                  <ListItemText primary={q.title} secondary={q.description} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="batch-label">Select Batch(es)</InputLabel>
            <Select
              labelId="batch-label"
              multiple
              value={selectedBatches}
              onChange={e => setSelectedBatches(e.target.value)}
              input={<OutlinedInput label="Select Batch(es)" />}
              renderValue={selected => selected.join(', ')}
            >
              {batches.map(batch => (
                <MenuItem key={batch} value={batch}>
                  <Checkbox checked={selectedBatches.indexOf(batch) > -1} />
                  <ListItemText primary={batch} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
          {success && <Typography color="success.main" sx={{ mb: 1 }}>{success}</Typography>}
          <Button variant="contained" onClick={handleCreateTest} disabled={loading} fullWidth size="large" sx={{ mt: 2 }}>
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultyTestCreation;
