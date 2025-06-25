import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import FacultySidebar from '../../components/FacultySidebar';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import axiosInstance from '../../api/axios';

const FacultyStudents = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignments(res.data || []);
        setSelectedAssignment(res.data[0]?.assignmentId || '');
      } catch {
        setAssignments([]);
      }
      setLoading(false);
    };
    fetchAssignments();
  }, []);

  const selected = assignments.find(a => a.assignmentId === selectedAssignment);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      {/* <Header title="Faculty - Students" /> */}
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">My Students</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2, mb: 2 }}>
          {loading ? (
            <CircularProgress />
          ) : (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Course / Batch / Semester</InputLabel>
              <Select
                value={selectedAssignment}
                label="Course / Batch / Semester"
                onChange={e => setSelectedAssignment(e.target.value)}
              >
                {assignments.map(a => (
                  <MenuItem key={a.assignmentId} value={a.assignmentId}>
                    {a.course?.name || '-'} ({a.course?.code || '-'}) - Batch {a.batch} / Sem {a.semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {selected && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Semester</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selected.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No students found</TableCell>
                  </TableRow>
                ) : (
                  selected.students.map(st => (
                    <TableRow key={st._id}>
                      <TableCell>{st.name}</TableCell>
                      <TableCell>{st.roll_number}</TableCell>
                      <TableCell>{st.batch}</TableCell>
                      <TableCell>{st.semester}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultyStudents;
