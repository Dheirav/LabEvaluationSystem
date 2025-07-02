import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput, Chip, TableContainer, Grid
} from '@mui/material';
import AdminSidebar from '../../components/AdminSidebar';
import Header from '../../components/Header';
import axios from 'axios';

const labCourses = [
  { _id: "cs23c04", name: "Programming in C", semester: 1 },
  { _id: "cs23101", name: "Computational Thinking", semester: 1 },
  { _id: "me23c01", name: "Engineering Drawing and 3D Modelling", semester: 2 },
  { _id: "cs23201", name: "Object Oriented Programming", semester: 2 },
  { _id: "cs23302", name: "Data Structures", semester: 3 },
  { _id: "cs23303", name: "Digital System Design", semester: 3 },
  { _id: "cs23304", name: "Java Programming", semester: 3 },
  { _id: "cs23401", name: "Database Management Systems", semester: 4 },
  { _id: "cs23402", name: "Computer Architecture", semester: 4 },
  { _id: "cs23403", name: "Full Stack Technologies", semester: 4 },
  { _id: "cs23501", name: "Operating Systems", semester: 5 },
  { _id: "cs23502", name: "Networks and Data Communication", semester: 5 },
  { _id: "cs23601", name: "Cryptography and System Security", semester: 6 },
  { _id: "cs23602", name: "Compiler Design", semester: 6 },
  { _id: "cs23603", name: "Machine Learning", semester: 6 },
  { _id: "cs23604", name: "Creative and Innovative Project", semester: 6 },
  { _id: "cs23801", name: "Project Work / Internship", semester: 8 }
];

const batchOptions = ['N', 'P', 'Q'];

const AdminFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [courseBatchState, setCourseBatchState] = useState({});
  const [saving, setSaving] = useState(false);
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    fetchFaculty();
    fetchAllCourses();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/get_users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaculty(res.data.filter(u => u.role === 'faculty'));
    } catch (err) {
      setFaculty([]);
    }
    setLoading(false);
  };

  const fetchAllCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllCourses(res.data || []);
    } catch (err) {
      setAllCourses([]);
    }
  };

  // Map of courseId (ObjectId as string or code) -> course object
  const courseMap = useMemo(() => {
    const map = {};
    allCourses.forEach(c => {
      map[c._id] = c;
      map[c.code] = c; // allow lookup by code as well
    });
    return map;
  }, [allCourses]);

  // Open assign dialog and initialize state
  const handleOpenAssign = (fac) => {
    setSelectedFaculty(fac);
    // Build initial state: { courseId: [batches] }
    const state = {};
    (fac.assignedCourseBatches || []).forEach(acb => {
      state[acb.course?._id || acb.course] = acb.batches || [];
    });
    setCourseBatchState(state);
    setAssignDialog(true);
  };

  // Handle batch selection for a course
  const handleBatchChange = (courseId, batches) => {
    setCourseBatchState(prev => ({
      ...prev,
      [courseId]: batches
    }));
  };

  // Handle course selection (add/remove course)
  const handleCourseToggle = (courseId) => {
    setCourseBatchState(prev => {
      const newState = { ...prev };
      if (newState[courseId]) {
        delete newState[courseId];
      } else {
        newState[courseId] = [];
      }
      return newState;
    });
  };

  // Submit all course-batch assignments
  const handleAssignCourses = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      // Prepare array: [{ course, batches }]
      const assignedCourseBatches = Object.entries(courseBatchState)
        .filter(([_, batches]) => Array.isArray(batches) && batches.length > 0)
        .map(([course, batches]) => ({
          course,
          batches: Array.isArray(batches) ? batches : []
        }));

      if (assignedCourseBatches.length === 0) {
        alert('Please assign at least one course with batches.');
        setSaving(false);
        return;
      }

      // --- FIX: Send one object at a time, as your backend expects only one courseId+batches per request ---
      // Send each assignment individually
      for (const { course, batches } of assignedCourseBatches) {
        await axios.put(
          `/api/auth/faculty/${selectedFaculty._id}/assign-course-batches`,
          { courseId: course, batches },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setAssignDialog(false);
      fetchFaculty();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
        'Failed to assign courses/batches'
      );
      console.error('Assign courses error:', err);
    }
    setSaving(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      <Header title="Admin - Faculty Course Assignment" />
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 3 }, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#222', fontWeight: 700, mb: 3 }}>
          Faculty Course Assignment
        </Typography>
        <Paper sx={{ p: { xs: 1, sm: 3 }, borderRadius: 3, mt: 2, background: '#23272f' }}>
          {loading ? (
            <Typography sx={{ color: '#b0bec5' }}>Loading...</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#374151' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Faculty ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {faculty.map((fac, idx) => (
                    <React.Fragment key={fac._id}>
                      <TableRow
                        hover
                        sx={{
                          background: idx % 2 === 0 ? '#2d3340' : '#23272f',
                          borderLeft: '6px solid',
                          borderColor: idx % 2 === 0 ? '#90caf9' : '#f48fb1'
                        }}
                      >
                        <TableCell sx={{ verticalAlign: 'top', fontWeight: 500, color: '#fff' }}>{fac.name}</TableCell>
                        <TableCell sx={{ verticalAlign: 'top', color: '#b0bec5' }}>{fac.user_id}</TableCell>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              borderColor: idx % 2 === 0 ? '#90caf9' : '#f48fb1',
                              color: idx % 2 === 0 ? '#90caf9' : '#f48fb1',
                              '&:hover': {
                                borderColor: idx % 2 === 0 ? '#42a5f5' : '#ec407a',
                                background: idx % 2 === 0 ? '#1e293b' : '#311b2b'
                              }
                            }}
                            onClick={() => handleOpenAssign(fac)}
                          >
                            Assign Courses & Batches
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} sx={{ p: 0, background: '#1a1d23' }}>
                          <Box sx={{ p: { xs: 1, sm: 2 } }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#90caf9' }}>
                              Assigned Courses
                            </Typography>
                            <Table size="small" sx={{ minWidth: 320, background: '#23272f' }}>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 500, color: '#b0bec5' }}>Course Name</TableCell>
                                  <TableCell sx={{ fontWeight: 500, color: '#b0bec5' }}>Batches</TableCell>
                                  <TableCell sx={{ fontWeight: 500, color: '#b0bec5' }}>Remove</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(fac.assignedCourseBatches || []).length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={3} sx={{ color: '#888' }}>No assignments</TableCell>
                                  </TableRow>
                                ) : (
                                  fac.assignedCourseBatches.map((acb, idx2) => {
                                    let courseObj = null;
                                    if (acb.course && typeof acb.course === 'object' && acb.course.name) {
                                      courseObj = acb.course;
                                    } else {
                                      courseObj = courseMap[acb.course?._id || acb.course] || null;
                                    }
                                    return (
                                      <TableRow key={idx2} sx={{ background: idx2 % 2 === 0 ? '#23272f' : '#2d3340' }}>
                                        <TableCell sx={{ color: '#fff' }}>
                                          {courseObj
                                            ? `${courseObj.name} (${courseObj.code})`
                                            : 'Unknown'}
                                        </TableCell>
                                        <TableCell sx={{ color: '#b0bec5' }}>
                                          {(acb.batches || []).join(', ')}
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            sx={{
                                              borderColor: '#f48fb1',
                                              color: '#f48fb1',
                                              '&:hover': {
                                                borderColor: '#ec407a',
                                                background: '#311b2b'
                                              }
                                            }}
                                            onClick={async () => {
                                              try {
                                                const token = localStorage.getItem('token');
                                                await axios.put(
                                                  `/api/auth/faculty/${fac._id}/assign-course-batches`,
                                                  {
                                                    assignedCourseBatches: (fac.assignedCourseBatches || [])
                                                      .filter((item, i) => i !== idx2)
                                                      .map(item => ({
                                                        course: item.course?._id || item.course,
                                                        batches: item.batches
                                                      }))
                                                  },
                                                  { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                fetchFaculty();
                                              } catch (err) {
                                                alert(
                                                  err?.response?.data?.message ||
                                                  'Failed to remove assignment'
                                                );
                                              }
                                            }}
                                          >
                                            Remove
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        {/* Unified Assign Courses & Batches Dialog */}
        <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Assign Courses & Batches to {selectedFaculty?.name}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              {labCourses.map(course => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 1, background: courseBatchState[course._id] ? '#e3f2fd' : '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Checkbox
                        checked={!!courseBatchState[course._id]}
                        onChange={() => handleCourseToggle(course._id)}
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {course.name} ({course._id})
                      </Typography>
                    </Box>
                    {courseBatchState[course._id] && (
                      <FormControl fullWidth>
                        <InputLabel>Batches</InputLabel>
                        <Select
                          multiple
                          value={courseBatchState[course._id]}
                          onChange={e => handleBatchChange(course._id, e.target.value)}
                          renderValue={selected => selected.join(', ')}
                        >
                          {batchOptions.map(b => (
                            <MenuItem key={b} value={b}>
                              <Checkbox checked={courseBatchState[course._id].includes(b)} />
                              <ListItemText primary={b} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAssignCourses}
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminFaculty;
