import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, CircularProgress, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Stack, Divider
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import AdminSidebar from '../../components/AdminSidebar';
import Header from '../../components/Header';
import axios from 'axios';
import ConfirmDialog from '../../components/ConfirmDialog';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseSemester, setNewCourseSemester] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

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

  const handleCreateCourseClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateCourseConfirm = async () => {
    setCreateDialogOpen(false);
    if (!newCourseName || !newCourseCode || !newCourseSemester) {
      setError('Please fill in all required fields: Course Name, Course Code, and Semester.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/courses', {
        name: newCourseName,
        code: newCourseCode,
        semester: newCourseSemester,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewCourseName('');
      setNewCourseCode('');
      setNewCourseSemester('');
      fetchCourses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDeleteCourseClick = (courseId) => {
    setCourseToDelete(courseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCourseConfirm = async () => {
    setDeleteDialogOpen(false);
    if (!courseToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/courses/${courseToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourseToDelete(null);
      fetchCourses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete course');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 3 }, overflow: 'auto' }}>
        <Typography variant="h4" color="white" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
          Course Management
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mt: 2, mb: 2 }}>
          <Paper sx={{
            p: 3,
            borderRadius: 3,
            minWidth: 320,
            flex: 1,
            background: 'rgba(255,255,255,0.10)',
            color: 'white',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease'
          }} elevation={8}>
            <Typography variant="h6" gutterBottom fontWeight={600} color="white">Create New Course</Typography>
            <Stack spacing={2} direction="column">
              <TextField
                label="Course Name"
                fullWidth
                value={newCourseName}
                onChange={e => setNewCourseName(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: '#e0e0e0' } }}
                InputProps={{ style: { color: 'white' } }}
              />
              <TextField
                label="Course Code"
                fullWidth
                value={newCourseCode}
                onChange={e => setNewCourseCode(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: '#e0e0e0' } }}
                InputProps={{ style: { color: 'white' } }}
              />
              <TextField
                label="Semester"
                fullWidth
                value={newCourseSemester}
                onChange={e => setNewCourseSemester(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: '#e0e0e0' } }}
                InputProps={{ style: { color: 'white' } }}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateCourseClick}
                sx={{ alignSelf: 'flex-end', mt: 1 }}
              >
                Create Course
              </Button>
            </Stack>
            <ConfirmDialog
              open={createDialogOpen}
              title="Confirm Create Course"
              message={`Are you sure you want to create the course "${newCourseName}" with code "${newCourseCode}"?`}
              onConfirm={handleCreateCourseConfirm}
              onCancel={() => setCreateDialogOpen(false)}
              confirmText="Create"
              cancelText="Cancel"
            />
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
          </Paper>
          <Paper sx={{
            p: 3,
            borderRadius: 3,
            flex: 2,
            background: 'rgba(255,255,255,0.10)',
            color: 'white',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'scale(1.01)' }
          }} elevation={8}>
            <Typography variant="h6" gutterBottom fontWeight={600} color="white">Existing Courses</Typography>
            <Divider sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
                <CircularProgress sx={{ color: 'white' }} />
              </Box>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <Table size="small" sx={{ background: 'transparent', borderRadius: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course._id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
                      <TableCell sx={{ color: 'white' }}>{course.name}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{course.code}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{course.semester}</TableCell>
                      <TableCell>
                        <IconButton aria-label="edit" size="small" sx={{ color: 'white' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton aria-label="delete" size="small" onClick={() => handleDeleteCourseClick(course._id)} sx={{ color: '#f87171' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Stack>
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Confirm Delete Course"
          message="Are you sure you want to delete this course? This action cannot be undone."
          onConfirm={handleDeleteCourseConfirm}
          onCancel={() => setDeleteDialogOpen(false)}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </Box>
    </Box>
  );
};

export default CourseManagement;
