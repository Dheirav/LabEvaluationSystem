import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Paper, CircularProgress, FormControl, InputLabel, Select, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import FacultySidebar from '../../components/FacultySidebar';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FacultyReports = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
        setError('Failed to fetch courses');
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedCourse || !reportType) return;

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/faculty/reports?course=${selectedCourse}&type=${reportType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data || []);
    } catch {
      setReportData([]);
      setError('Failed to generate report');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      {/* <Header title="Faculty - Reports" /> */}
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">Reports</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="select-course-label">Select Course</InputLabel>
            <Select
              labelId="select-course-label"
              id="select-course"
              value={selectedCourse}
              label="Select Course"
              onChange={e => setSelectedCourse(e.target.value)}
            >
              {courses.map(course => (
                <MenuItem key={course._id} value={course._id}>{course.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="select-report-type-label">Select Report Type</InputLabel>
            <Select
              labelId="select-report-type-label"
              id="select-report-type"
              value={reportType}
              label="Select Report Type"
              onChange={e => setReportType(e.target.value)}
            >
              <MenuItem value="performance">Class Performance</MenuItem>
              <MenuItem value="progress">Student Progress</MenuItem>
              <MenuItem value="attendance">Attendance</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleGenerateReport}>Generate Report</Button>

          {loading ? (
            <CircularProgress sx={{ mt: 2 }} />
          ) : error ? (
            <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
          ) : reportData.length > 0 ? (
            <Table sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  {Object.keys(reportData[0]).map(key => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map(row => (
                  <TableRow key={row._id}>
                    {Object.values(row).map((value, index) => (
                      <TableCell key={index}>{value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultyReports;
