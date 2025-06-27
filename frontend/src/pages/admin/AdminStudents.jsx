import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  TableSortLabel,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminSidebar from '../../components/AdminSidebar';
import Header from '../../components/Header';

import axios from 'axios';

const departmentOptions = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CHEM', 'BIO'
];
const batchOptions = ['N', 'P', 'Q'];
const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('');
  const [batch, setBatch] = useState('');
  const [department, setDepartment] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Table pagination/sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        // Try fallback endpoint if /api/admin/students is 404
        let res;
        try {
          res = await axios.get('/api/admin/students', {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          // If 404, try /api/auth/get_users and filter students
          if (err?.response?.status === 404) {
            res = await axios.get('/api/auth/get_users', {
              headers: { Authorization: `Bearer ${token}` }
            });
            // Filter for students and map to expected fields
            const users = Array.isArray(res.data) ? res.data : [];
            const students = users.filter(u => u.role === 'student').map(u => ({
              _id: u._id,
              name: u.name,
              rollNumber: u.roll_number || u.rollNumber,
              dob: u.dob,
              semester: u.semester,
              batch: u.batch,
              department: u.department
            }));
            setStudents(students);
            setLoading(false);
            return;
          } else {
            throw err;
          }
        }
        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (res.data.students && Array.isArray(res.data.students)) {
          data = res.data.students;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          data = res.data.data;
        } else if (res.data.results && Array.isArray(res.data.results)) {
          data = res.data.results;
        } else if (res.data.message) {
          setError('Backend error: ' + res.data.message);
        } else {
          setError('Unexpected response from backend: ' + JSON.stringify(res.data));
        }
        setStudents(data);
      } catch (err) {
        setError(
          err?.response?.data?.message
            ? `Failed to fetch students: ${err.response.data.message}`
            : `Failed to fetch students: ${err.message || err.toString()}`
        );
        setStudents([]);
        console.error('Fetch students error:', err);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // Filtering
  useEffect(() => {
    let data = students;
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        stu =>
          stu.name.toLowerCase().includes(s) ||
          (stu.rollNumber || '').toLowerCase().includes(s)
      );
    }
    if (semester) data = data.filter(stu => String(stu.semester) === String(semester));
    if (batch) data = data.filter(stu => stu.batch === batch);
    if (department) data = data.filter(stu => stu.department === department);
    setFiltered(data);
  }, [students, search, semester, batch, department]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = (a[orderBy] ?? '').toString().toLowerCase();
      const bVal = (b[orderBy] ?? '').toString().toLowerCase();
      if (order === 'asc') return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });
  }, [filtered, orderBy, order]);

  // Edit
  const handleEdit = (stu) => {
    setEditStudent({ ...stu });
    setEditDialog(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      // Always use the working endpoint for updating users
      await axios.put(
        `/api/auth/update/users/${editStudent._id}`,
        {
          name: editStudent.name,
          user_id: editStudent.user_id,
          roll_number: editStudent.rollNumber,
          role: 'student',
          batch: editStudent.batch,
          semester: editStudent.semester,
          department: editStudent.department
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEditDialog(false);
      setEditStudent(null);
      // Refresh
      let res;
      try {
        res = await axios.get('/api/admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // Fallback to /api/auth/get_users if 404
        if (err?.response?.status === 404) {
          res = await axios.get('/api/auth/get_users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const users = Array.isArray(res.data) ? res.data : [];
          const students = users.filter(u => u.role === 'student').map(u => ({
            _id: u._id,
            name: u.name,
            rollNumber: u.roll_number || u.rollNumber,
            dob: u.dob,
            semester: u.semester,
            batch: u.batch,
            department: u.department
          }));
          setStudents(students);
          setSaving(false);
          return;
        } else {
          throw err;
        }
      }
      setStudents(res.data || []);
    } catch (err) {
      if (err?.response?.status === 403) {
        alert('You do not have permission to update this student. (403 Forbidden)');
      } else if (err?.response?.data?.message) {
        alert('Failed to update student: ' + err.response.data.message);
      } else {
        alert('Failed to update student');
      }
    }
    setSaving(false);
  };

  // Delete
  const handleDelete = (stu) => {
    setStudentToDelete(stu);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      // Try /api/admin/students/:id, fallback to /api/auth/delete/users/:id if 404
      try {
        await axios.delete(`/api/admin/students/${studentToDelete._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          await axios.delete(`/api/auth/delete/users/${studentToDelete._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          throw err;
        }
      }
      setDeleteDialog(false);
      setStudentToDelete(null);
      // Refresh
      let res;
      try {
        res = await axios.get('/api/admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // Fallback to /api/auth/get_users if 404
        if (err?.response?.status === 404) {
          res = await axios.get('/api/auth/get_users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const users = Array.isArray(res.data) ? res.data : [];
          const students = users.filter(u => u.role === 'student').map(u => ({
            _id: u._id,
            name: u.name,
            rollNumber: u.roll_number || u.rollNumber,
            dob: u.dob,
            semester: u.semester,
            batch: u.batch,
            department: u.department
          }));
          setStudents(students);
          setSaving(false);
          return;
        } else {
          throw err;
        }
      }
      setStudents(res.data || []);
    } catch (err) {
      alert('Failed to delete student');
    }
    setSaving(false);
  };

  // Table handlers
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Add a debug log to see what is being rendered
  useEffect(() => {
    console.log('Rendering students:', students);
  }, [students]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #23272f 80%, #374151 100%)' }}>
      <Header title="Admin - Students" />
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 3 }, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>
          Student Management
        </Typography>
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 3, background: '#23272f', boxShadow: 3 }}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Search by name or roll number"
                value={search}
                onChange={e => setSearch(e.target.value)}
                fullWidth
                size="small"
                sx={{ background: '#1a1d23', borderRadius: 1, input: { color: '#fff' }, label: { color: '#b0bec5' } }}
                InputLabelProps={{ style: { color: '#b0bec5' } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small" sx={{ background: '#1a1d23', borderRadius: 1 }}>
                <InputLabel sx={{ color: '#b0bec5' }}>Semester</InputLabel>
                <Select
                  value={semester}
                  label="Semester"
                  onChange={e => setSemester(e.target.value)}
                  sx={{ color: '#fff' }}
                  MenuProps={{
                    PaperProps: { sx: { background: '#23272f', color: '#fff' } }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {semesterOptions.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small" sx={{ background: '#1a1d23', borderRadius: 1 }}>
                <InputLabel sx={{ color: '#b0bec5' }}>Batch</InputLabel>
                <Select
                  value={batch}
                  label="Batch"
                  onChange={e => setBatch(e.target.value)}
                  sx={{ color: '#fff' }}
                  MenuProps={{
                    PaperProps: { sx: { background: '#23272f', color: '#fff' } }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {batchOptions.map(b => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" sx={{ background: '#1a1d23', borderRadius: 1 }}>
                <InputLabel sx={{ color: '#b0bec5' }}>Department</InputLabel>
                <Select
                  value={department}
                  label="Department"
                  onChange={e => setDepartment(e.target.value)}
                  sx={{ color: '#fff' }}
                  MenuProps={{
                    PaperProps: { sx: { background: '#23272f', color: '#fff' } }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {departmentOptions.map(dep => (
                    <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TableContainer sx={{ maxHeight: 480, background: '#23272f', borderRadius: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ background: '#374151' }}>
                  <TableCell sx={{ color: '#90caf9', fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ color: '#90caf9', fontWeight: 700 }}>Roll Number</TableCell>
                  <TableCell sx={{ color: '#90caf9', fontWeight: 700 }}>Date of Birth</TableCell>
                  <TableCell sx={{ color: '#90caf9', fontWeight: 700 }}>Semester</TableCell>
                  <TableCell sx={{ color: '#90caf9', fontWeight: 700 }}>Batch</TableCell>
                  <TableCell sx={{ color: '#90caf9', fontWeight: 700 }}>Department</TableCell>
                  <TableCell sx={{ color: '#90caf9', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress sx={{ color: '#90caf9' }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: 'red' }}>
                      {error}
                    </TableCell>
                  </TableRow>
                ) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: '#b0bec5' }}>
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(stu => (
                      <TableRow key={stu._id || stu.id || Math.random()} hover sx={{ background: '#2d3340' }}>
                        <TableCell sx={{ color: '#fff' }}>{stu.name}</TableCell>
                        <TableCell sx={{ color: '#b0bec5' }}>{stu.rollNumber}</TableCell>
                        <TableCell sx={{ color: '#b0bec5' }}>{stu.dob ? new Date(stu.dob).toLocaleDateString() : '-'}</TableCell>
                        <TableCell sx={{ color: '#b0bec5' }}>{stu.semester}</TableCell>
                        <TableCell sx={{ color: '#b0bec5' }}>{stu.batch}</TableCell>
                        <TableCell sx={{ color: '#b0bec5' }}>{stu.department}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEdit(stu)} sx={{ color: '#90caf9' }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(stu)} sx={{ color: '#f48fb1' }}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[8, 16, 32]}
            component="div"
            count={sorted.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: '#b0bec5',
              '.MuiTablePagination-select': { color: '#b0bec5' },
              '.MuiTablePagination-selectIcon': { color: '#b0bec5' },
              '.MuiTablePagination-displayedRows': { color: '#b0bec5' }
            }}
          />
        </Paper>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  name="name"
                  value={editStudent?.name || ''}
                  onChange={handleEditChange}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Roll Number"
                  name="rollNumber"
                  value={editStudent?.rollNumber || ''}
                  onChange={handleEditChange}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={editStudent?.dob ? editStudent.dob.slice(0, 10) : ''}
                  onChange={handleEditChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    name="semester"
                    value={editStudent?.semester || ''}
                    label="Semester"
                    onChange={handleEditChange}
                  >
                    {semesterOptions.map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Batch</InputLabel>
                  <Select
                    name="batch"
                    value={editStudent?.batch || ''}
                    label="Batch"
                    onChange={handleEditChange}
                  >
                    {batchOptions.map(b => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={editStudent?.department || ''}
                    label="Department"
                    onChange={handleEditChange}
                  >
                    {departmentOptions.map(dep => (
                      <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Delete Student</DialogTitle>
          <DialogContent>
            Are you sure you want to delete student{' '}
            <b>{studentToDelete?.name}</b> ({studentToDelete?.rollNumber})?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                setSaving(true);
                try {
                  const token = localStorage.getItem('token');
                  // Try /api/admin/students/:id, fallback to /api/auth/delete/users/:id if 404
                  try {
                    await axios.delete(`/api/admin/students/${studentToDelete._id}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                  } catch (err) {
                    if (err?.response?.status === 404) {
                      await axios.delete(`/api/auth/delete/users/${studentToDelete._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                    } else {
                      throw err;
                    }
                  }
                  setDeleteDialog(false);
                  setStudentToDelete(null);
                  // Refresh
                  let res;
                  try {
                    res = await axios.get('/api/admin/students', {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                  } catch (err) {
                    // Fallback to /api/auth/get_users if 404
                    if (err?.response?.status === 404) {
                      res = await axios.get('/api/auth/get_users', {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      const users = Array.isArray(res.data) ? res.data : [];
                      const students = users.filter(u => u.role === 'student').map(u => ({
                        _id: u._id,
                        name: u.name,
                        rollNumber: u.roll_number || u.rollNumber,
                        dob: u.dob,
                        semester: u.semester,
                        batch: u.batch,
                        department: u.department
                      }));
                      setStudents(students);
                      setSaving(false);
                      return;
                    } else {
                      throw err;
                    }
                  }
                  setStudents(res.data || []);
                } catch (err) {
                  alert('Failed to delete student');
                }
                setSaving(false);
              }}
              color="error"
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminStudents;
