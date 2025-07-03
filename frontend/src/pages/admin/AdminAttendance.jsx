

import React, { useState } from 'react';
import { Box, Paper, Typography, Toolbar, Button, TextField } from '@mui/material';
import AdminSidebar from '../../components/AdminSidebar';
import Header from '../../components/Header';
import AttendanceTable from '../../components/AttendanceTable';
import axios from '../../api/axios';

const AdminAttendance = () => {
  const [filters, setFilters] = useState({ batch: '', semester: '', course: '' });
  const [downloading, setDownloading] = useState(false);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleExport = async () => {
    setDownloading(true);
    try {
      const params = [];
      if (filters.course) params.push(`course=${encodeURIComponent(filters.course)}`);
      if (filters.batch) params.push(`batch=${encodeURIComponent(filters.batch)}`);
      if (filters.semester) params.push(`semester=${encodeURIComponent(filters.semester)}`);
      const url = `/attendance/students/export${params.length ? '?' + params.join('&') : ''}`;
      const res = await axios.get(url, { responseType: 'blob' });
      const urlBlob = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', 'attendance_report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to export CSV');
    }
    setDownloading(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Lab Evaluation System - Admin" />
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, marginLeft: '240px' }}>
        <Toolbar />
        <Typography variant="h5" sx={{ mb: 2, color: '#222' }}>Student Attendance Report</Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField name="batch" label="Batch" value={filters.batch} onChange={handleChange} size="small" />
            <TextField name="semester" label="Semester" value={filters.semester} onChange={handleChange} size="small" />
            <TextField name="course" label="Course ID" value={filters.course} onChange={handleChange} size="small" />
            <Button onClick={handleExport} disabled={downloading} variant="contained" color="primary">
              {downloading ? 'Exporting...' : 'Export CSV'}
            </Button>
          </Box>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <AttendanceTable filterOptions={filters} />
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminAttendance;
