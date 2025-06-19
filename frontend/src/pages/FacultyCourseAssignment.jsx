import React, { useState, useEffect } from 'react';
import { Box, Toolbar, Typography, Grid, Paper, Select, MenuItem, Button, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';
import axios from 'axios';

const FacultyCourseAssignment = () => {
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [assignedCourses, setAssignedCourses] = useState([]);

  const batches = ['N', 'P', 'Q']; // Example batches

  useEffect(() => {
    fetchFacultiesAndCourses();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      fetchAssignedCourses(selectedFaculty);
    } else {
      setAssignedCourses([]);
    }
  }, [selectedFaculty]);

  const fetchFacultiesAndCourses = async () => {
    try {
      const facultyRes = await axios.get('/api/admin/users?role=faculty'); // Assuming an endpoint to get faculties
      setFaculties(facultyRes.data);

      const courseRes = await axios.get('/api/admin/courses'); // Assuming an endpoint to get courses
      setCourses(courseRes.data);
    } catch (error) {
      console.error('Error fetching faculties and courses:', error);
    }
  };

  const fetchAssignedCourses = async (facultyId) => {
    try {
      const res = await axios.get(`/api/admin/assigned-courses/${facultyId}`);
      setAssignedCourses(res.data);
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
    }
  };

  const handleAssignFaculty = async () => {
    try {
      await axios.post('/api/admin/assign-faculty', {
        facultyId: selectedFaculty,
        courseId: selectedCourse,
        batch: selectedBatch,
      });
      alert('Faculty assigned successfully!');
      setSelectedCourse('');
      setSelectedBatch('');
      fetchAssignedCourses(selectedFaculty); // Refresh the list
    } catch (error) {
      console.error('Error assigning faculty:', error);
      alert(error.response?.data?.message || 'Error assigning faculty');
    }
  };

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
            Faculty Course Assignment
          </Typography>
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
              mb: 4,
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Faculty</InputLabel>
                  <Select
                    value={selectedFaculty}
                    label="Faculty"
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Faculty</em>
                    </MenuItem>
                    {faculties.map((faculty) => (
                      <MenuItem key={faculty._id} value={faculty._id}>
                        {faculty.name} ({faculty.user_id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth disabled={!selectedFaculty}>
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={selectedCourse}
                    label="Course"
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Course</em>
                    </MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course._id} value={course._id}>
                        {course.name} ({course.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth disabled={!selectedFaculty || !selectedCourse}>
                  <InputLabel>Batch</InputLabel>
                  <Select
                    value={selectedBatch}
                    label="Batch"
                    onChange={(e) => setSelectedBatch(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Batch</em>
                    </MenuItem>
                    {batches.map((batch) => (
                      <MenuItem key={batch} value={batch}>
                        {batch}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleAssignFaculty}
                  disabled={!selectedFaculty || !selectedCourse || !selectedBatch}
                >
                  Assign Faculty to Course
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {selectedFaculty && (
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
              }}
            >
              <Typography variant="h6" gutterBottom>
                Assigned Courses for Selected Faculty
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course Name</TableCell>
                      <TableCell>Course Code</TableCell>
                      <TableCell>Batch</TableCell>
                      <TableCell>Assigned Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignedCourses.map((assignment) => (
                      <TableRow key={assignment._id}>
                        <TableCell>{assignment.courseId.name}</TableCell>
                        <TableCell>{assignment.courseId.code}</TableCell>
                        <TableCell>{assignment.batch}</TableCell>
                        <TableCell>{new Date(assignment.assignedDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FacultyCourseAssignment;
