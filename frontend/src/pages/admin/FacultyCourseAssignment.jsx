import React, { useState, useEffect } from 'react';
import { Box, Toolbar, Typography, Grid, Paper, Select, MenuItem, Button, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import AdminSidebar from '../../components/AdminSidebar';
import Header from '../../components/Header';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '../../components/ConfirmDialog';
import TablePagination from '@mui/material/TablePagination';

const FacultyCourseAssignment = () => {
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [allFacultyAssignments, setAllFacultyAssignments] = useState([]);

  // Editing state
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editCourse, setEditCourse] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editSemester, setEditSemester] = useState('');

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Assignment confirmation dialog state
  const [assignConfirmOpen, setAssignConfirmOpen] = useState(false);

  const batches = ['N', 'P', 'Q'];
  useEffect(() => {
    fetchFacultiesAndCourses();
    fetchAllFacultyAssignments();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      fetchAssignedCourses(selectedFaculty);
    } else {
      setAssignedCourses([]);
    }
  }, [selectedFaculty]);

  // Listen for assignment/log updates via SSE
  useEffect(() => {
    const eventSource = new window.EventSource('/api/logs/stream');
    eventSource.addEventListener('logUpdate', () => {
      fetchAllFacultyAssignments();
      if (selectedFaculty) fetchAssignedCourses(selectedFaculty);
    });
    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line
  }, [selectedFaculty]);

  const fetchFacultiesAndCourses = async () => {
    try {
      const facultyRes = await axios.get('/api/admin/users?role=faculty'); 
      setFaculties(facultyRes.data); // <-- This was missing!
      const courseRes = await axios.get('/api/admin/courses'); 
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

  const fetchAllFacultyAssignments = async () => {
    try {
      const res = await axios.get('/api/admin/faculty-assignments');
      setAllFacultyAssignments(res.data);
    } catch (error) {
      console.error('Error fetching all faculty assignments:', error);
    }
  };

  const handleAssignFaculty = async () => {
    try {
      await axios.post('/api/admin/assign-faculty', {
        facultyId: selectedFaculty,
        courseId: selectedCourse,
        batch: selectedBatch,
        semester: selectedSemester,
      });
      alert('Faculty assigned successfully!');
      setSelectedCourse('');
      setSelectedBatch('');
      setSelectedSemester('');
      fetchAssignedCourses(selectedFaculty); // Refresh the list
    } catch (error) {
      console.error('Error assigning faculty:', error);
      alert(error.response?.data?.message || 'Error assigning faculty');
    }
  };

  // Delete assignment with confirm dialog
  const handleDeleteAssignment = (assignmentId) => {
    setConfirmMessage('Are you sure you want to delete this assignment?');
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`/api/admin/faculty-course/${assignmentId}`);
        fetchAllFacultyAssignments();
        if (selectedFaculty) fetchAssignedCourses(selectedFaculty);
      } catch (error) {
        alert('Error deleting assignment');
      }
    });
    setConfirmOpen(true);
  };

  // Start editing
  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setEditCourse(assignment.courseId?._id || '');
    setEditBatch(assignment.batch || '');
    setEditSemester(assignment.semester || '');
  };

  // Save edit with confirm dialog
  const handleSaveEdit = async () => {
    setConfirmMessage('Are you sure you want to save changes to this assignment?');
    setConfirmAction(() => async () => {
      try {
        await axios.put(`/api/admin/faculty-course/${editingAssignment._id}`,
          { courseId: editCourse, batch: editBatch, semester: editSemester });
        setEditingAssignment(null);
        fetchAllFacultyAssignments();
        if (selectedFaculty) fetchAssignedCourses(selectedFaculty);
      } catch (error) {
        alert('Error updating assignment');
      }
    });
    setConfirmOpen(true);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingAssignment(null);
  };

  // Pagination state for all faculty assignments
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle faculty assignment button click
  const handleAssignFacultyClick = () => {
    setAssignConfirmOpen(true);
  };

  // Handle faculty assignment confirmation
  const handleAssignFacultyConfirm = async () => {
    setAssignConfirmOpen(false);
    try {
      await axios.post('/api/admin/assign-faculty', {
        facultyId: selectedFaculty,
        courseId: selectedCourse,
        batch: selectedBatch,
        semester: selectedSemester,
      });
      alert('Faculty assigned successfully!');
      setSelectedCourse('');
      setSelectedBatch('');
      setSelectedSemester('');
      fetchAssignedCourses(selectedFaculty); // Refresh the list
    } catch (error) {
      console.error('Error assigning faculty:', error);
      alert(error.response?.data?.message || 'Error assigning faculty');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 3 }, overflow: 'auto', maxHeight: '100vh' }}>
        <Box sx={{ p: 3, overflow: 'auto', maxHeight: 'calc(100vh - 32px)' }}>
          <Typography variant="h4" color="white" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
            Faculty Assignment
          </Typography>
          {/* Assignment Form */}
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
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth sx={{ minWidth: 300 }}>
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
                <FormControl fullWidth disabled={!selectedFaculty} sx={{ minWidth: 300 }}>
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
                <FormControl fullWidth disabled={!selectedFaculty || !selectedCourse} sx={{ minWidth: 200 }}>
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
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth disabled={!selectedFaculty || !selectedCourse || !selectedBatch} sx={{ minWidth: 200 }}>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={selectedSemester}
                    label="Semester"
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Semester</em>
                    </MenuItem>
                    {[1,2,3,4,5,6,7,8].map((sem) => (
                      <MenuItem key={sem} value={sem}>{sem}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleAssignFacultyClick}
                  disabled={!selectedFaculty || !selectedCourse || !selectedBatch || !selectedSemester}
                >
                  Assign Faculty to Course
                </Button>
              </Grid>
            </Grid>
          </Paper>
          {/* Assigned Courses for Selected Faculty */}
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
                mb: 4,
                maxHeight: 300,
                overflow: 'auto',
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
                      <TableCell>Semester</TableCell>
                      <TableCell>Assigned Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignedCourses.map((assignment) => (
                      <TableRow key={assignment._id}>
                        <TableCell>{assignment.courseId.name}</TableCell>
                        <TableCell>{assignment.courseId.code}</TableCell>
                        <TableCell>{assignment.batch}</TableCell>
                        <TableCell>{assignment.semester}</TableCell>
                        <TableCell>{new Date(assignment.assignedDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
          {/* All Faculty Assignments Table */}
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
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            <Typography variant="h6" gutterBottom>
              All Faculty Assignments
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Faculty Name</TableCell>
                    <TableCell>Faculty ID</TableCell>
                    <TableCell>Course Name</TableCell>
                    <TableCell>Course Code</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Semester</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allFacultyAssignments.flatMap(faculty =>
                    (faculty.assignedCourses || []).map(assignment => ({ faculty, assignment }))
                  )
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(({ faculty, assignment }) => (
                      <TableRow key={faculty._id + '-' + assignment._id}>
                        <TableCell>{faculty.name}</TableCell>
                        <TableCell>{faculty.user_id}</TableCell>
                        <TableCell>{assignment.courseId?.name}</TableCell>
                        <TableCell>{assignment.courseId?.code}</TableCell>
                        <TableCell>{assignment.batch}</TableCell>
                        <TableCell>{assignment.semester}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditAssignment(assignment)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteAssignment(assignment._id)} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={allFacultyAssignments.reduce((acc, faculty) => acc + (faculty.assignedCourses?.length || 0), 0)}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
          {/* Confirm Dialogs */}
          <ConfirmDialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={async () => {
              setConfirmOpen(false);
              if (confirmAction) await confirmAction();
            }}
            message={confirmMessage}
          />
          <ConfirmDialog
            open={assignConfirmOpen}
            title="Confirm Assignment"
            message={`Are you sure you want to assign this faculty to the selected course, batch, and semester?`}
            onConfirm={handleAssignFacultyConfirm}
            onCancel={() => setAssignConfirmOpen(false)}
            confirmText="Assign"
            cancelText="Cancel"
          />
          {/* Edit Assignment Dialog */}
          {editingAssignment && (
            <Paper elevation={6} sx={{ p: 3, mb: 3, background: 'rgba(255,255,255,0.15)' }}>
              <Typography variant="h6" gutterBottom>Edit Assignment</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={editCourse}
                      label="Course"
                      onChange={e => setEditCourse(e.target.value)}
                    >
                      <MenuItem value=""><em>Select Course</em></MenuItem>
                      {courses.map(course => (
                        <MenuItem key={course._id} value={course._id}>{course.name} ({course.code})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Batch</InputLabel>
                    <Select
                      value={editBatch}
                      label="Batch"
                      onChange={e => setEditBatch(e.target.value)}
                    >
                      <MenuItem value=""><em>Select Batch</em></MenuItem>
                      {batches.map(batch => (
                        <MenuItem key={batch} value={batch}>{batch}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Semester</InputLabel>
                    <Select
                      value={editSemester}
                      label="Semester"
                      onChange={e => setEditSemester(e.target.value)}
                    >
                      <MenuItem value=""><em>Select Semester</em></MenuItem>
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <MenuItem key={sem} value={sem}>{sem}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary" onClick={handleSaveEdit} sx={{ mr: 2 }}>Save</Button>
                  <Button variant="outlined" onClick={handleCancelEdit}>Cancel</Button>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FacultyCourseAssignment;
