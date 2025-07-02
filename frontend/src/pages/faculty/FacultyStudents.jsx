import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, CircularProgress, Paper, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Box, Typography, Paper, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import FacultySidebar from '../../components/FacultySidebar';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import axiosInstance from '../../api/axios';

const FacultyStudents = () => {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const fetchGroups = async () => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGroups(res.data || []);
      } catch {
        setGroups([]);
      }
      setLoading(false);
    };
    fetchGroups();
  }, []);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box className="flex min-h-screen bg-gradient-to-br from-[#282f2f] to-[#becdcd]">
      <Header title="Faculty - Students" />
      <FacultySidebar facultyName={user?.name} />
      <main className="flex-1 p-4 sm:p-8 overflow-auto">
        <Typography variant="h4" gutterBottom className="text-white font-bold mb-6">
          My Students (by Course & Batch)
        </Typography>
        <Paper className="p-4 rounded-2xl bg-white/10 shadow-lg">
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
            <div className="flex justify-center items-center py-8">
              <CircularProgress />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No students found.</div>
          ) : (
            <div className="space-y-4">
              {groups.map((group, idx) => {
                const sectionKey = `${group.courseName}-${group.batch}`;
                return (
                  <div key={sectionKey} className="border border-gray-300 rounded-lg bg-white/70">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-t-lg focus:outline-none"
                      onClick={() => toggleSection(sectionKey)}
                    >
                      <span className="font-semibold text-gray-800">
                        Course: {group.courseName} &nbsp;|&nbsp; Semester {group.semester} &nbsp;|&nbsp; Batch {group.batch}
                      </span>
                      <IconButton size="small">
                        {openSections[sectionKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </button>
                    {openSections[sectionKey] && (
                      <div className="p-4 overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Roll Number</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Batch</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Department</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.students.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center text-gray-400 py-4">No students in this batch.</td>
                              </tr>
                            ) : (
                              group.students.map(st => (
                                <tr key={st._id || st.roll_number}>
                                  <td className="px-3 py-2">{st.name}</td>
                                  <td className="px-3 py-2">{st.roll_number}</td>
                                  <td className="px-3 py-2">{st.batch}</td>
                                  <td className="px-3 py-2">{st.department}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
      </main>
    </Box>
  );
};

export default FacultyStudents;
