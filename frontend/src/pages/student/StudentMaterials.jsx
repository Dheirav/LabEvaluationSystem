import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, CircularProgress, Button, Link, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import StudentSidebar from '../../components/StudentSidebar';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const StudentMaterials = () => {
  const { user } = useContext(AuthContext);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [courseOptions, setCourseOptions] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/lab-manuals', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const mats = res.data || [];
        setMaterials(mats);
        // Build unique course and date options
        const courses = Array.from(new Set(mats.map(m => m.course?.name).filter(Boolean)));
        setCourseOptions(courses);
        // Use uploadDate if present, else fallback to createdAt
        const dates = Array.from(new Set(mats.map(m => (m.uploadDate || m.createdAt) ? (m.uploadDate || m.createdAt).slice(0,10) : null).filter(Boolean)));
        setDateOptions(dates);
      } catch (err) {
        setMaterials([]);
        setError('Failed to fetch study materials');
      }
      setLoading(false);
    };
    fetchMaterials();
  }, []);

  // Filtering logic
  const filteredMaterials = materials.filter(mat => {
    const courseMatch = selectedCourse === 'all' || mat.course?.name === selectedCourse;
    const dateStr = (mat.uploadDate || mat.createdAt) ? (mat.uploadDate || mat.createdAt).slice(0,10) : null;
    const dateMatch = selectedDate === 'all' || (dateStr === selectedDate);
    return courseMatch && dateMatch;
  });

  // Group by course
  const grouped = {};
  filteredMaterials.forEach(mat => {
    const cname = mat.course?.name || 'Other';
    if (!grouped[cname]) grouped[cname] = [];
    grouped[cname].push(mat);
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <StudentSidebar studentName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">My Study Materials</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2, mb: 2 }}>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Course</InputLabel>
              <Select
                value={selectedCourse}
                label="Course"
                onChange={e => setSelectedCourse(e.target.value)}
              >
                <MenuItem value="all">All Courses</MenuItem>
                {courseOptions.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Date</InputLabel>
              <Select
                value={selectedDate}
                label="Date"
                onChange={e => setSelectedDate(e.target.value)}
              >
                <MenuItem value="all">All Dates</MenuItem>
                {dateOptions.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center">{error}</Typography>
          ) : filteredMaterials.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 8 }}>
              No study materials found.
            </Typography>
          ) : (
            Object.entries(grouped).map(([course, mats]) => (
              <Box key={course} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#1976d2' }}>{course}</Typography>
                <List>
                  {mats.map((mat) => (
                    <ListItem key={mat._id} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                      <ListItemText
                        primary={
                          <span style={{ color: '#222', fontWeight: 500 }}>
                            {mat.originalname || mat.title || mat.filename}
                            <span style={{ color: '#90caf9' }}> ({mat.course?.name || ''})</span>
                          </span>
                        }
                        secondary={
                          <span style={{ color: '#607d8b' }}>
                            Uploaded by: {mat.faculty?.name || 'Faculty'} | Uploaded on: {(mat.uploadDate || mat.createdAt) ? (mat.uploadDate || mat.createdAt).slice(0,10) : 'N/A'}
                          </span>
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        component={Link}
                        href={`/uploads/labmanuals/${mat.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        Download
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default StudentMaterials;
