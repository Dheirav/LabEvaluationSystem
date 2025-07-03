import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FacultySidebar from '../../components/FacultySidebar';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FacultyStudents = () => {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]); // For expandable group view
  const [assignments, setAssignments] = useState([]); // For select+table view
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // If the response is an array of assignments with assignmentId, use for select+table
        if (Array.isArray(res.data) && res.data[0]?.assignmentId) {
          setAssignments(res.data);
          setSelectedAssignment(res.data[0]?.assignmentId || '');
        }
        // If the response is an array of groups with courseName, use for expandable view
        if (Array.isArray(res.data) && res.data[0]?.courseName) {
          setGroups(res.data);
        }
      } catch {
        setAssignments([]);
        setGroups([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selected = assignments.find(a => a.assignmentId === selectedAssignment);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">My Students</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2, mb: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Expandable group view if groups data is present */}
              {groups.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  {groups.map((group, idx) => {
                    const sectionKey = `${group.courseName}-${group.batch}`;
                    return (
                      <Box key={sectionKey} sx={{ border: '1px solid #ccc', borderRadius: 2, mb: 2, bgcolor: 'white', boxShadow: 1 }}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, bgcolor: '#f5f5f5', borderTopLeftRadius: 8, borderTopRightRadius: 8, cursor: 'pointer' }}
                          onClick={() => toggleSection(sectionKey)}
                        >
                          <Typography fontWeight={600} color="#222">
                            Course: {group.courseName} | Semester {group.semester} | Batch {group.batch}
                          </Typography>
                          <IconButton size="small">
                            {openSections[sectionKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                        {openSections[sectionKey] && (
                          <Box sx={{ p: 2, overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Roll Number</TableCell>
                                  <TableCell>Batch</TableCell>
                                  <TableCell>Department</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {group.students.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} align="center">No students in this batch.</TableCell>
                                  </TableRow>
                                ) : (
                                  group.students.map(st => (
                                    <TableRow key={st._id || st.roll_number}>
                                      <TableCell>{st.name}</TableCell>
                                      <TableCell>{st.roll_number}</TableCell>
                                      <TableCell>{st.batch}</TableCell>
                                      <TableCell>{st.department}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
              {/* Select+table view if assignments data is present */}
              {assignments.length > 0 && (
                <>
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
                  {selected && (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Roll Number</TableCell>
                          <TableCell>Batch</TableCell>
                          <TableCell>Semester</TableCell>
                          <TableCell>Department</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selected.students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">No students found</TableCell>
                          </TableRow>
                        ) : (
                          selected.students.map(st => (
                            <TableRow key={st._id || st.roll_number}>
                              <TableCell>{st.name}</TableCell>
                              <TableCell>{st.roll_number}</TableCell>
                              <TableCell>{st.batch}</TableCell>
                              <TableCell>{st.semester}</TableCell>
                              <TableCell>{st.department}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
              {/* If no data at all */}
              {groups.length === 0 && assignments.length === 0 && !loading && (
                <Typography align="center" color="text.secondary" sx={{ py: 8 }}>
                  No students found.
                </Typography>
              )}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultyStudents;
