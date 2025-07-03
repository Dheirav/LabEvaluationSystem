

import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TablePagination, TableSortLabel } from '@mui/material';

const AttendanceTable = ({ filterOptions }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  // Sorting logic
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

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Always send at least one filter to match backend requirements
    let params = {};
    if (filterOptions) {
      if (filterOptions.course) params.course_id = filterOptions.course;
      else if (filterOptions.batch) params.batch = filterOptions.batch;
      else if (filterOptions.semester) params.semester = filterOptions.semester;
    }
    // If no filters, use a dummy batch to avoid 400 error (or show message)
    if (Object.keys(params).length === 0) {
      setAttendance([]);
      setLoading(false);
      return;
    }
    axios.get('/attendance/students', { params })
      .then(res => {
        setAttendance(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch attendance');
        setLoading(false);
      });
  }, [filterOptions]);


  if (loading) return <Typography sx={{ p: 2 }}>Loading attendance...</Typography>;
  if (error) return <Typography color="error" sx={{ p: 2 }}>{error}</Typography>;

  // Flatten sessions for pagination
  const flattened = [];
  sortData(attendance).forEach((student) => {
    (student.sessions || []).forEach((s, idx) => {
      flattened.push({
        ...s,
        student: student.student || {
          name: student.name,
          email: student.email,
          batch: student.batch,
          semester: student.semester,
        },
        key: (student.student?._id || student.student_id || student._id || '') + '-' + idx
      });
    });
  });

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'name'}
                direction={orderBy === 'name' ? order : 'asc'}
                onClick={() => handleRequestSort('name')}
              >Name</TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'email'}
                direction={orderBy === 'email' ? order : 'asc'}
                onClick={() => handleRequestSort('email')}
              >Email</TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'batch'}
                direction={orderBy === 'batch' ? order : 'asc'}
                onClick={() => handleRequestSort('batch')}
              >Batch</TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'semester'}
                direction={orderBy === 'semester' ? order : 'asc'}
                onClick={() => handleRequestSort('semester')}
              >Semester</TableSortLabel>
            </TableCell>
            <TableCell>Session Login</TableCell>
            <TableCell>Session Logout</TableCell>
            <TableCell>Duration (min)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {flattened.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">No attendance records found.</TableCell>
            </TableRow>
          ) : (
            flattened.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.student.name}</TableCell>
                <TableCell>{row.student.email}</TableCell>
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={flattened.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_e, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </TableContainer>
  );
};

export default AttendanceTable;
