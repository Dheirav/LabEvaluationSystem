import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, CircularProgress, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';
import axios from 'axios';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data || []);
    } catch (error) {
      setCourses([]);
      setError('Failed to fetch courses');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async () => {
    if (!newCourseName || !newCourseCode) {
      setError('Please fill in all required fields: Course Name and Course Code.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/courses', {
        name: newCourseName,
        code: newCourseCode,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewCourseName('');
      setNewCourseCode('');
      fetchCourses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete course');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Admin - Course Management" />
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">Course Management</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>Create New Course</Typography>
          <TextField
            label="Course Name"
            fullWidth
            value={newCourseName}
            onChange={e => setNewCourseName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Course Code"
            fullWidth
            value={newCourseCode}
            onChange={e => setNewCourseCode(e.target.value)}
          />
          <Button variant="contained" onClick={handleCreateCourse}>Create Course</Button>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Existing Courses</Typography>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course._id}>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.code}</TableCell>
                    <TableCell>
                      <IconButton aria-label="edit">
                        <EditIcon />
                      </IconButton>
                      <IconButton aria-label="delete" onClick={() => handleDeleteCourse(course._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default CourseManagement;
