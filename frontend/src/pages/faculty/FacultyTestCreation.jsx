import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText, OutlinedInput, Chip, CircularProgress, FormControlLabel
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import FacultySidebar from '../../components/FacultySidebar';

const FacultyTestCreation = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  // Inline questions for the test
  const [questions, setQuestions] = useState([]); // questions to be added to the test
  const [questionForm, setQuestionForm] = useState({
    title: '',
    description: '',
    expectedAnswer: '',
    topic: '',
    tags: [],
    difficulty: '',
    marks: ''
  });
  const [questionFormError, setQuestionFormError] = useState('');
  const [testName, setTestName] = useState('');
  const [date, setDate] = useState('');
  const [timeWindow, setTimeWindow] = useState([]); // array of selected time slots
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [type, setType] = useState('test'); // 'test' or 'exercise'
  const [batches, setBatches] = useState([]); // New: list of batches for selected course
  const [selectedBatches, setSelectedBatches] = useState([]); // New: selected batches
  const [ruleTags, setRuleTags] = useState([]); // For tag-based rule
  const [ruleMark, setRuleMark] = useState(''); // For mark-based rule
  const [ruleCount, setRuleCount] = useState(''); // Number of questions to select
  const [envSettings, setEnvSettings] = useState({
    allowTabSwitch: false,
    allowExternalCopyPaste: false,
    allowInternalCopyPaste: true,
    enforceFullscreen: false // New: enforce fullscreen
  });
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

  // Helper to check if selected time slots are contiguous
  function areTimeSlotsContiguous(selected, slots) {
    if (!selected.length) return true;
    const indices = selected.map(s => slots.indexOf(s)).sort((a, b) => a - b);
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) return false;
    }
    return true;
  }

  const handleCreateTest = async () => {
    setError(''); setSuccess('');
    if (!testName || !selectedCourse || questions.length === 0 || !date || timeWindow.length === 0 || !type || selectedBatches.length === 0) {
      setError('All fields are required.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/faculty/tests', {
        name: testName,
        course: selectedCourse,
        questions: questions.map(q => ({
          ...q,
          marks: Number(q.marks)
        })),
        date,
        duration: timeWindow.length * 60, // example: 1hr per slot
        environmentSettings: envSettings,
        batches: selectedBatches,
        numQuestions: ruleCount ? Number(ruleCount) : undefined
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Test created successfully!');
      setTestName(''); setQuestions([]); setDate(''); setTimeWindow([]); setType('test'); setSelectedBatches([]);
    } catch {
      setError('Failed to create test.');
    }
  };

  // Add a question to the test
  const handleAddQuestion = () => {
    setQuestionFormError('');
    const { title, description, expectedAnswer, topic, tags, difficulty, marks } = questionForm;
    if (!title || !topic || !difficulty || !marks) {
      setQuestionFormError('Title, topic, difficulty, and marks are required.');
      return;
    }
    setQuestions(qs => [...qs, { ...questionForm, marks: Number(marks), tags: Array.isArray(tags) ? tags : [] }]);
    setQuestionForm({ title: '', description: '', expectedAnswer: '', topic: '', tags: [], difficulty: '', marks: '' });
  };

  const handleRemoveQuestion = idx => {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  };

  // Extract all unique tags and marks from questions
  const allTags = Array.from(new Set(questions.flatMap(q => q.tags || [])));
  const allMarks = Array.from(new Set(questions.map(q => q.details?.marks).filter(Boolean)));

  const handleApplyRules = () => {
    let filtered = questions;
    if (ruleTags.length > 0) {
      filtered = filtered.filter(q => q.tags && ruleTags.every(tag => q.tags.includes(tag)));
    }
    if (ruleMark) {
      filtered = filtered.filter(q => String(q.details?.marks) === String(ruleMark));
    }
    if (ruleCount) {
      filtered = filtered.slice(0, Number(ruleCount));
    }
    setSelectedQuestions(filtered.map(q => q._id));
  };

  // Randomly pick N questions from filtered set
  const handleRandomPick = () => {
    let filtered = questions;
    if (ruleTags.length > 0) {
      filtered = filtered.filter(q => q.tags && ruleTags.every(tag => q.tags.includes(tag)));
    }
    if (ruleMark) {
      filtered = filtered.filter(q => String(q.details?.marks) === String(ruleMark));
    }
    let count = Number(ruleCount) || filtered.length;
    // Shuffle and pick
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    setSelectedQuestions(shuffled.slice(0, count).map(q => q._id));
  };

  const handleEnvSettingChange = (key) => (e) => {
    setEnvSettings({ ...envSettings, [key]: e.target.checked });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      {/* <Header title="Faculty - Test Creation" /> */}
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', pt: 6, height: '100vh', overflow: 'auto' }}>
        <Paper sx={{ p: 4, maxWidth: 900, width: '100%', maxHeight: '75vh', overflow: 'auto', pb: 8 }} elevation={4}>
          <Typography variant="h4" gutterBottom align="center">Create New Test/Exercise</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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
                onChange={e => {
                  const value = e.target.value;
                  if (areTimeSlotsContiguous(value, timeSlots)) {
                    setTimeWindow(value);
                  }
                }}
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
              {timeWindow.length > 1 && !areTimeSlotsContiguous(timeWindow, timeSlots) && (
                <Typography color="error" variant="caption">Time slots must be contiguous.</Typography>
              )}
            </FormControl>
            {/* Add Question Form */}
            <Box sx={{ gridColumn: '1 / -1', mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2, background: '#f9f9f9' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Add Question to Test</Typography>
              <TextField label="Title" fullWidth sx={{ mb: 1 }} value={questionForm.title} onChange={e => setQuestionForm(f => ({ ...f, title: e.target.value }))} required />
              <TextField label="Description" fullWidth sx={{ mb: 1 }} value={questionForm.description} onChange={e => setQuestionForm(f => ({ ...f, description: e.target.value }))} multiline rows={2} />
              <TextField label="Expected Answer" fullWidth sx={{ mb: 1 }} value={questionForm.expectedAnswer} onChange={e => setQuestionForm(f => ({ ...f, expectedAnswer: e.target.value }))} multiline rows={2} />
              <TextField label="Topic" fullWidth sx={{ mb: 1 }} value={questionForm.topic} onChange={e => setQuestionForm(f => ({ ...f, topic: e.target.value }))} required />
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel id="difficulty-label">Difficulty</InputLabel>
                <Select labelId="difficulty-label" value={questionForm.difficulty} label="Difficulty" onChange={e => setQuestionForm(f => ({ ...f, difficulty: e.target.value }))} required>
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel id="tags-label">Tags</InputLabel>
                <Select labelId="tags-label" multiple value={questionForm.tags} onChange={e => setQuestionForm(f => ({ ...f, tags: e.target.value }))} input={<OutlinedInput label="Tags" />} renderValue={selected => selected.join(', ')}>
                  {['Array', 'String', 'Math', 'DP', 'Graph', 'Tree', 'Sorting', 'Greedy', 'Other'].map(tag => (
                    <MenuItem key={tag} value={tag}>
                      <Checkbox checked={questionForm.tags.indexOf(tag) > -1} />
                      <ListItemText primary={tag} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Marks" type="number" fullWidth sx={{ mb: 1 }} value={questionForm.marks} onChange={e => setQuestionForm(f => ({ ...f, marks: e.target.value }))} required />
              {questionFormError && <Typography color="error" sx={{ mb: 1 }}>{questionFormError}</Typography>}
              <Button variant="contained" onClick={handleAddQuestion} sx={{ mt: 1 }}>+ Add Question to Test</Button>
            </Box>
            {/* Preview List of Added Questions */}
            <Box sx={{ gridColumn: '1 / -1', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Questions in Test ({questions.length})</Typography>
              {questions.length === 0 ? <Typography color="text.secondary">No questions added yet.</Typography> : (
                <Box>
                  {questions.map((q, idx) => (
                    <Paper key={idx} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{q.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{q.description}</Typography>
                        <Typography variant="caption">Topic: {q.topic} | Difficulty: {q.difficulty} | Tags: {q.tags?.join(', ')} | Marks: {q.marks}</Typography>
                      </Box>
                      <Button color="error" onClick={() => handleRemoveQuestion(idx)}>Remove</Button>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="rule-tags-label">Filter by Tag(s)</InputLabel>
              <Select
                labelId="rule-tags-label"
                multiple
                value={ruleTags}
                onChange={e => setRuleTags(e.target.value)}
                input={<OutlinedInput label="Filter by Tag(s)" />}
                renderValue={selected => selected.join(', ')}
              >
                {allTags.map(tag => (
                  <MenuItem key={tag} value={tag}>
                    <Checkbox checked={ruleTags.indexOf(tag) > -1} />
                    <ListItemText primary={tag} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="rule-mark-label">Filter by Mark</InputLabel>
              <Select
                labelId="rule-mark-label"
                value={ruleMark}
                onChange={e => setRuleMark(e.target.value)}
                input={<OutlinedInput label="Filter by Mark" />}
                renderValue={selected => selected}
              >
                {allMarks.map(mark => (
                  <MenuItem key={mark} value={mark}>{mark}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Number of Questions for Each Student (optional)"
              type="number"
              fullWidth
              sx={{ mb: 2 }}
              value={ruleCount}
              onChange={e => setRuleCount(e.target.value)}
              inputProps={{ min: 1 }}
              helperText="How many unique questions each student should get. Leave blank to use all."
            />
          </Box>
          <Box sx={{ gridColumn: '1 / -1', mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Test Environment Settings</Typography>
            <FormControlLabel
              control={<Checkbox checked={envSettings.allowTabSwitch} onChange={handleEnvSettingChange('allowTabSwitch')} />}
              label="Allow Tab Switching (Alt+Tab, switching browser tabs)"
            />
            <FormControlLabel
              control={<Checkbox checked={envSettings.allowExternalCopyPaste} onChange={handleEnvSettingChange('allowExternalCopyPaste')} />}
              label="Allow External Copy-Paste (from outside the test)"
            />
            <FormControlLabel
              control={<Checkbox checked={envSettings.allowInternalCopyPaste} onChange={handleEnvSettingChange('allowInternalCopyPaste')} />}
              label="Allow Internal Copy-Paste (within the test)"
            />
            <FormControlLabel
              control={<Checkbox checked={envSettings.enforceFullscreen || false} onChange={handleEnvSettingChange('enforceFullscreen')} />}
              label="Enforce Fullscreen Mode (student cannot exit fullscreen during test)"
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={handleApplyRules} sx={{ mb: 2, mr: 1 }}>
              Auto-Select Questions by Rules
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleRandomPick} sx={{ mb: 2 }}>
              Random Pick
            </Button>
          </Box>
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
