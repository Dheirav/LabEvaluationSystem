import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import FacultySidebar from '../../components/FacultySidebar';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const FacultyTestList = () => {
  const { user } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', date: '', time: '' });

  const fetchTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/faculty/tests', { headers: { Authorization: `Bearer ${token}` } });
      setTests(res.data || []);
    } catch {
      setTests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleEditClick = (test) => {
    setSelectedTest(test);
    setEditForm({ name: test.name, date: test.date ? test.date.substring(0, 10) : '', time: test.time || '' });
    setEditDialogOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/faculty/tests/${selectedTest._id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      setEditDialogOpen(false);
      setSelectedTest(null);
      fetchTests();
    } catch {}
  };

  const handleDeleteClick = (test) => {
    setSelectedTest(test);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/faculty/tests/${selectedTest._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDeleteDialogOpen(false);
      setSelectedTest(null);
      fetchTests();
    } catch {}
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ef, #becdcd)' }}>
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, background: 'transparent' }}>
        {/* <Header title="Faculty - My Tests" /> */}
        <Paper sx={{
          p: 4,
          borderRadius: 4,
          mt: 4,
          maxWidth: 900,
          width: '100%',
          background: '#fff',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
          overflowX: 'auto',
          minHeight: 400
        }} elevation={6}>
          <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 700, mb: 3 }}>
            My Tests/Exercises
          </Typography>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}><CircularProgress /></Box> : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Questions</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tests.length === 0 ? (
                    <TableRow><TableCell colSpan={6}>No tests found.</TableCell></TableRow>
                  ) : tests.map(test => (
                    <TableRow key={test._id}>
                      <TableCell>{test.name}</TableCell>
                      <TableCell>{test.course?.name}</TableCell>
                      <TableCell>{test.date ? test.date.substring(0, 10) : ''}</TableCell>
                      <TableCell>{test.time}</TableCell>
                      <TableCell>{test.questions.length}</TableCell>
                      <TableCell>
                        <IconButton color="primary" onClick={() => handleEditClick(test)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => handleDeleteClick(test)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit Test</DialogTitle>
          <DialogContent>
            <TextField margin="dense" label="Name" name="name" value={editForm.name} onChange={handleEditChange} fullWidth />
            <TextField margin="dense" label="Date" name="date" type="date" value={editForm.date} onChange={handleEditChange} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField margin="dense" label="Time" name="time" value={editForm.time} onChange={handleEditChange} fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Test</DialogTitle>
          <DialogContent>Are you sure you want to delete this test?</DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default FacultyTestList;
