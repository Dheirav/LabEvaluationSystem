import React, { useEffect, useState, useContext, useMemo } from 'react';
import axios from '../../api/axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TablePagination, TableSortLabel, Box, TextField, MenuItem, FormControl, InputLabel, Select, Stack, Button, CircularProgress } from '@mui/material';
import ConfirmDialog from '../../components/ConfirmDialog';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';

const FacultyAttendance = () => {
  // Fetch all attendance records on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get('/attendance/students')
      .then(res => {
        setAttendance(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch attendance');
        setLoading(false);
      });
  }, []);
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  // Filtering states
  const [search, setSearch] = useState('');
  const [batch, setBatch] = useState('');
  const [semester, setSemester] = useState('');
  // Dialog state (moved inside component)
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState('');
  const [showResultDialog, setShowResultDialog] = useState(false);

  // Download attendance in selected format from backend
  const [downloadFormat, setDownloadFormat] = useState('csv');
  const handleDownload = async () => {
    setActionLoading(true);
    setActionResult('');
    try {
      let endpoint = `/attendance/students/export/${downloadFormat}`;
      let ext = downloadFormat === 'excel' ? 'xlsx' : downloadFormat;
      const res = await axios.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
      setActionResult('Download successful.');
    } catch (err) {
      setActionResult('Failed to download report.');
    }
    setActionLoading(false);
  };

  // Clear logs via backend
  const handleClearLogs = async () => {
    setActionLoading(true);
    setActionResult('');
    try {
      await axios.delete('/attendance/students/logs');
      setActionResult('Attendance logs cleared.');
      // Optionally refresh data
      setAttendance([]);
    } catch (err) {
      setActionResult('Failed to clear logs.');
    }
    setActionLoading(false);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortData = (data) => {
    return data.slice().sort((a, b) => {
      const isAsc = order === 'asc';
      const aValue = (a.student?.[orderBy] ?? a[orderBy] ?? '').toString();
      const bValue = (b.student?.[orderBy] ?? b[orderBy] ?? '').toString();
      return isAsc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  };

  // Flatten attendance data for table display and filtering
  const flattened = useMemo(() => {
    let data = [];
    attendance.forEach((student, idx) => {
      // If student.sessions exists, flatten each session
      if (Array.isArray(student.sessions) && student.sessions.length > 0) {
        student.sessions.forEach((session, sidx) => {
          data.push({
            student: student.student || {
              name: student.name,
              email: student.email,
              batch: student.batch,
              semester: student.semester,
            },
            login: session.login,
            logout: session.logout,
            durationMinutes: session.durationMinutes,
            key: (student.student?._id || student.student_id || student._id || '') + '-' + idx + '-' + sidx
          });
        });
      } else {
        data.push({
          student: student.student || {
            name: student.name,
            email: student.email,
            batch: student.batch,
            semester: student.semester,
          },
          login: student.login,
          logout: student.logout,
          durationMinutes: student.durationMinutes,
          key: (student.student?._id || student.student_id || student._id || '') + '-' + idx
        });
      }
    });
    // Filtering
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(row =>
        row.student.name.toLowerCase().includes(s) ||
        row.student.email.toLowerCase().includes(s)
      );
    }
    if (batch) data = data.filter(row => String(row.student.batch) === String(batch));
    if (semester) data = data.filter(row => String(row.student.semester) === String(semester));
    // Sorting
    data = sortData(data);
    return data;
  }, [attendance, search, batch, semester, order, orderBy]);

  // Get unique batch and semester options
  const batchOptions = useMemo(() => {
    const set = new Set();
    attendance.forEach(stu => {
      if (stu.batch) set.add(stu.batch);
    });
    return Array.from(set);
  }, [attendance]);
  const semesterOptions = useMemo(() => {
    const set = new Set();
    attendance.forEach(stu => {
      if (stu.semester) set.add(stu.semester);
    });
    return Array.from(set);
  }, [attendance]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Attendance Tracker" />
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #23272f 80%, #3a4457 100%)',
            borderRadius: 4,
            p: { xs: 2, sm: 4 },
            mb: 3,
            boxShadow: 3,
            color: 'white',
            maxWidth: 1100,
            mx: 'auto',
            mt: 8
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white' }}>
            Student Attendance
          </Typography>
          {loading ? (
            <Typography sx={{ p: 2 }}>Loading attendance...</Typography>
          ) : error ? (
            <Typography color="error" sx={{ p: 2 }}>{error}</Typography>
          ) : (
            <>
              {/* Action Buttons */}
              <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="download-format-label">Download Format</InputLabel>
                  <Select
                    labelId="download-format-label"
                    value={downloadFormat}
                    label="Download Format"
                    onChange={e => setDownloadFormat(e.target.value)}
                  >
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" color="primary" onClick={() => setDownloadDialogOpen(true)}>
                  Download
                </Button>
                <Button variant="outlined" color="error" onClick={() => setClearDialogOpen(true)}>
                  Clear Logs
                </Button>
              </Stack>
              {/* Download Confirm Dialog */}
              <ConfirmDialog
                open={downloadDialogOpen}
                title="Download Attendance Report"
                message={`Download the full attendance report as a ${downloadFormat.toUpperCase()} file?`}
                confirmText={actionLoading ? 'Downloading...' : 'Download'}
                cancelText="Cancel"
                onCancel={() => { setDownloadDialogOpen(false); setActionResult(''); }}
                onConfirm={async () => {
                  await handleDownload();
                  setDownloadDialogOpen(false);
                  setShowResultDialog(true);
                }}
              />
              {/* Clear Logs Confirm Dialog */}
              <ConfirmDialog
                open={clearDialogOpen}
                title="Clear Attendance Logs"
                message="Are you sure you want to clear all attendance logs? This cannot be undone."
                confirmText={actionLoading ? 'Clearing...' : 'Clear'}
                cancelText="Cancel"
                onCancel={() => { setClearDialogOpen(false); setActionResult(''); }}
                onConfirm={async () => {
                  await handleClearLogs();
                  setClearDialogOpen(false);
                  setShowResultDialog(true);
                }}
              />
              {/* Result Dialog */}
              <ConfirmDialog
                open={showResultDialog && !!actionResult}
                title="Action Result"
                message={actionResult}
                confirmText="OK"
                cancelText=""
                onCancel={() => { setShowResultDialog(false); setActionResult(''); }}
                onConfirm={() => { setShowResultDialog(false); setActionResult(''); }}
              />
              {/* Filters */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                  label="Search by name"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  size="small"
                  sx={{ minWidth: 220, background: '#1a1d23', borderRadius: 1 }}
                  InputLabelProps={{ style: { color: '#b0bec5' } }}
                  inputProps={{ style: { color: '#fff' } }}
                />
                <FormControl size="small" sx={{ minWidth: 140, background: '#1a1d23', borderRadius: 1 }}>
                  <InputLabel sx={{ color: '#b0bec5' }}>Batch</InputLabel>
                  <Select
                    value={batch}
                    label="Batch"
                    onChange={e => { setBatch(e.target.value); setPage(0); }}
                    sx={{ color: '#fff' }}
                    MenuProps={{ PaperProps: { sx: { background: '#23272f', color: '#fff' } } }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {batchOptions.map(b => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140, background: '#1a1d23', borderRadius: 1 }}>
                  <InputLabel sx={{ color: '#b0bec5' }}>Semester</InputLabel>
                  <Select
                    value={semester}
                    label="Semester"
                    onChange={e => { setSemester(e.target.value); setPage(0); }}
                    sx={{ color: '#fff' }}
                    MenuProps={{ PaperProps: { sx: { background: '#23272f', color: '#fff' } } }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {semesterOptions.map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Paper
                elevation={8}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  mx: 'auto',
                  mt: 2,
                  maxHeight: '80vh',
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#222',
                }}
              >
                <TableContainer sx={{ boxShadow: 'none', bgcolor: 'transparent', maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Batch</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Semester</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Session Login</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Session Logout</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Duration (min)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {flattened.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No attendance records found.</TableCell>
                        </TableRow>
                      ) : (
                        flattened.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                          <TableRow key={row.key}
                            sx={{ backgroundColor: row.durationMinutes === null ? 'rgba(255, 255, 0, 0.1)' : 'transparent' }}
                          >
                            <TableCell>{row.student.name}</TableCell>
                            <TableCell>{row.student.batch}</TableCell>
                            <TableCell>{row.student.semester}</TableCell>
                            <TableCell>{row.login ? new Date(row.login).toLocaleString() : ''}</TableCell>
                            <TableCell>{row.logout ? new Date(row.logout).toLocaleString() : ''}</TableCell>
                            <TableCell>{row.durationMinutes !== null ? row.durationMinutes : ''}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={flattened.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  sx={{
                    borderTop: '1px solid rgba(224, 224, 224, 1)',
                    mt: 'auto',
                    height: '64px'
                  }}
                />
              </Paper>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default FacultyAttendance;
