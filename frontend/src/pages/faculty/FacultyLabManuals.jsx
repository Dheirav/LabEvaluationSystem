import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemText,
  TextField
} from '@mui/material';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FacultyLabManuals = () => {
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [manuals, setManuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [courseBatchPairs, setCourseBatchPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState({ course: '', batch: '', semester: '' });
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const fileInputRef = useRef(null);

  const fetchManuals = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/faculty/lab-manuals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManuals(res.data || []);
    } catch (err) {
      console.error('Failed to fetch manuals:', err);
      setManuals([]);
    }
  }, []);

  useEffect(() => {
      const fetchAssignments = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('/api/faculty/courses', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const assignmentsData = res.data || [];
          setAssignments(assignmentsData);
          // Build course-batch-semester pairs for dropdown
          const pairs = assignmentsData.map(a => ({
            assignmentId: a._id,
            course: a.courseId?._id,
            courseName: a.courseId?.name,
            courseCode: a.courseId?.code,
            batch: a.batch,
            semester: a.semester
          }));
          setCourseBatchPairs(pairs);
        } catch (err) {
          setAssignments([]);
          setCourseBatchPairs([]);
          setMsg('Failed to fetch courses');
        }
        setLoading(false);
      };

      fetchAssignments();
      fetchManuals();
    }, [fetchManuals]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedPair.course || !selectedPair.batch || !selectedPair.semester) {
      setMsg('Please select a course, batch, semester, and file.');
      return;
    }
    setUploading(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('course', selectedPair.course);
      formData.append('batch', selectedPair.batch);
      formData.append('semester', selectedPair.semester);
      formData.append('title', title);

      await axios.post('/api/faculty/lab-manuals/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMsg('Upload successful');
      setFile(null);
      setSelectedPair({ course: '', batch: '', semester: '' });
      setTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      fetchManuals();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Faculty - Lab Manuals" />
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">
          Lab Manual Upload
        </Typography>

        {/* Upload Form */}
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2, mb: 3 }}>
          <form onSubmit={handleUpload}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="course-batch-label">Course, Batch & Semester</InputLabel>
              <Select
                labelId="course-batch-label"
                id="course-batch-select"
                value={selectedPair.course && selectedPair.batch && selectedPair.semester ? `${selectedPair.course}|${selectedPair.batch}|${selectedPair.semester}` : ''}
                label="Course, Batch & Semester"
                onChange={e => {
                  const [course, batch, semester] = e.target.value.split('|');
                  setSelectedPair({ course, batch, semester });
                }}
                required
              >
                {courseBatchPairs.map(pair => (
                  <MenuItem key={pair.assignmentId} value={`${pair.course}|${pair.batch}|${pair.semester}`}>
                    {pair.courseName} ({pair.courseCode}) - Batch {pair.batch} - Semester {pair.semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="outlined" component="label" sx={{ mr: 2 }}>
              Choose File
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={e => setFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.ppt,.pptx"
              />
            </Button>
            {file && <span>{file.name}</span>}
            <Button type="submit" variant="contained" disabled={uploading} sx={{ ml: 2 }}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>

            {msg && (
              <Typography sx={{ mt: 2, color: msg.includes('fail') ? 'error.main' : 'success.main' }}>
                {msg}
              </Typography>
            )}
          </form>
        </Paper>

        {/* Assigned Courses */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Assigned Courses, Batches & Semesters
          </Typography>
          <List>
            {assignments.length === 0 ? (
              <ListItem>
                <ListItemText primary="No assigned courses." />
              </ListItem>
            ) : (
              assignments.map((a) => (
                <ListItem key={a._id}>
                  <ListItemText
                    primary={`${a.courseId?.name || 'Unknown'} (${a.courseId?.code || ''})`}
                    secondary={`Batch: ${a.batch} | Semester: ${a.semester}`}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>
        {/* Uploaded Lab Manuals */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Lab Manuals
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <List>
              {manuals.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No lab manuals uploaded." />
                </ListItem>
              ) : (
                manuals.map((m) => (
                  <ListItem key={m._id}>
                    <ListItemText
                      primary={m.originalname}
                      secondary={m.course?.name ? `${m.course.name} (${m.course.code})` : ''}
                    />
                    <Button
                      href={`/uploads/labmanuals/${m.filename}`}
                      target="_blank"
                      rel="noopener"
                      size="small"
                    >
                      Download
                    </Button>
                  </ListItem>
                ))
              )}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultyLabManuals;
