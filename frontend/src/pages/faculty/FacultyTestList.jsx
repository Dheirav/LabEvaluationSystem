import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText, OutlinedInput, Chip, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';

const FacultyTestList = () => {
  const { user } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editFields, setEditFields] = useState({ name: '', date: '', time: '', questions: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [questionDialog, setQuestionDialog] = useState(false);
  const [questionPaper, setQuestionPaper] = useState([]);
  const [testEvaluations, setTestEvaluations] = useState({}); // { testId: { finished: bool, result: {...} } }

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

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        let url = '/api/faculty/tests';
        if (selectedCourse) url += `?course=${selectedCourse}`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        setTests(res.data || []);
      } catch {
        setTests([]);
      }
      setLoading(false);
    };
    fetchTests();
  }, [selectedCourse, success]);

  // Fetch evaluations for all tests after tests are loaded
  useEffect(() => {
    if (tests.length === 0) return;
    const fetchEvaluations = async () => {
      const token = localStorage.getItem('token');
      const evalsByTest = {};
      for (const test of tests) {
        try {
          const res = await axios.get(`/api/faculty/evaluations?test=${test._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const evals = res.data || [];
          const finished = evals.every(e => e.status === 'completed');
          const avg = evals.length ? (evals.reduce((a, e) => a + (e.marksObtained || 0), 0) / evals.length).toFixed(2) : '-';
          evalsByTest[test._id] = {
            finished,
            result: {
              total: evals.length,
              avg,
              completed: evals.filter(e => e.status === 'completed').length
            }
          };
        } catch {
          evalsByTest[test._id] = { finished: false, result: { total: 0, avg: '-', completed: 0 } };
        }
      }
      setTestEvaluations(evalsByTest);
    };
    fetchEvaluations();
  }, [tests]);

  const handleEditOpen = async (test) => {
    setEditTest(test);
    setEditFields({
      name: test.name,
      date: test.date ? test.date.substring(0, 10) : '',
      time: test.time || '',
      questions: test.questions.map(q => q._id)
    });
    // Fetch questions for the course
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/faculty/questions?course=${test.course._id}&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data.questions || []);
    } catch {
      setQuestions([]);
    }
    setEditDialog(true);
    setError('');
    setSuccess('');
  };

  const handleEditSave = async () => {
    setError('');
    if (!editFields.name || !editFields.date || !editFields.time || editFields.questions.length === 0) {
      setError('All fields are required.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/faculty/tests/${editTest._id}`, {
        name: editFields.name,
        date: editFields.date,
        time: editFields.time,
        questions: editFields.questions
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Test updated!');
      setEditDialog(false);
    } catch {
      setError('Failed to update test.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/faculty/tests/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Test deleted!');
    } catch {
      setError('Failed to delete test.');
    }
  };

  const handleViewQuestions = (test) => {
    setQuestionPaper(test.questions || []);
    setQuestionDialog(true);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ef, #becdcd)' }}>
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, background: 'transparent' }}>
        <Header title="Faculty - My Tests" />
        <Paper sx={{
          p: 4,
          borderRadius: 4,
          mt: 4,
          maxWidth: 1100,
          width: '100%',
          background: '#fff',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
          overflowX: 'auto',
          minHeight: 600
        }} elevation={6}>
          <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 700, mb: 3 }}>
            My Tests/Exercises
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="course-label">Filter by Course</InputLabel>
            <Select
              labelId="course-label"
              value={selectedCourse}
              label="Filter by Course"
              onChange={e => setSelectedCourse(e.target.value)}
            >
              <MenuItem value="">All Courses</MenuItem>
              {courses.map(course => (
                <MenuItem key={course._id} value={course._id}>{course.name} ({course.code})</MenuItem>
              ))}
            </Select>
          </FormControl>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}><CircularProgress /></Box> : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Questions</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tests.length === 0 ? (
                    <TableRow><TableCell colSpan={8}>No tests found.</TableCell></TableRow>
                  ) : tests.map(test => (
                    <TableRow key={test._id}>
                      <TableCell>{test.name}</TableCell>
                      <TableCell>{test.course?.name}</TableCell>
                      <TableCell>{test.date ? test.date.substring(0, 10) : ''}</TableCell>
                      <TableCell>{test.time}</TableCell>
                      <TableCell>{test.questions.length}</TableCell>
                      <TableCell>{testEvaluations[test._id]?.finished ? 'Finished' : 'Ongoing'}</TableCell>
                      <TableCell>
                        {testEvaluations[test._id]?.result
                          ? `Avg: ${testEvaluations[test._id].result.avg}, Done: ${testEvaluations[test._id].result.completed}/${testEvaluations[test._id].result.total}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditOpen(test)}><EditIcon /></IconButton>
                        <IconButton onClick={() => handleDelete(test._id)}><DeleteIcon /></IconButton>
                        <IconButton onClick={() => handleViewQuestions(test)}><VisibilityIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        {/* Edit Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Test</DialogTitle>
          <DialogContent>
            <TextField
              label="Test Name"
              fullWidth
              sx={{ mb: 2 }}
              value={editFields.name}
              onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              value={editFields.date}
              onChange={e => setEditFields(f => ({ ...f, date: e.target.value }))}
            />
            <TextField
              label="Time"
              type="text"
              fullWidth
              sx={{ mb: 2 }}
              value={editFields.time}
              onChange={e => setEditFields(f => ({ ...f, time: e.target.value }))}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="edit-questions-label">Select Questions</InputLabel>
              <Select
                labelId="edit-questions-label"
                multiple
                value={editFields.questions}
                onChange={e => setEditFields(f => ({ ...f, questions: e.target.value }))}
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
                    <Checkbox checked={editFields.questions.indexOf(q._id) > -1} />
                    <ListItemText primary={q.title} secondary={q.description} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleEditSave}>Save</Button>
          </DialogActions>
        </Dialog>
        {/* Question Paper Dialog */}
        <Dialog open={questionDialog} onClose={() => setQuestionDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Question Paper</DialogTitle>
          <DialogContent>
            {questionPaper.length === 0 ? (
              <Typography>No questions found.</Typography>
            ) : (
              <Box>
                {questionPaper.map((q, idx) => (
                  <Box key={q._id || idx} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{`Q${idx + 1}: ${q.title}`}</Typography>
                    {q.description && <Typography sx={{ mb: 1 }}>{q.description}</Typography>}
                    {q.expectedAnswer && <Typography variant="body2" color="text.secondary">Expected: {q.expectedAnswer}</Typography>}
                    {q.tags && q.tags.length > 0 && <Typography variant="caption">Tags: {q.tags.join(', ')}</Typography>}
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default FacultyTestList;
