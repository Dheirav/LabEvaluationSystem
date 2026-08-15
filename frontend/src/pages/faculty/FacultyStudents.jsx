import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, CircularProgress, Paper, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel, Collapse, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FacultySidebar from '../../components/FacultySidebar';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FacultyStudents = () => {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const fetchGroups = async () => {
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
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 4, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white" fontWeight={700} mb={4}>
          My Students (by Course & Batch)
        </Typography>
        <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.95)', boxShadow: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : groups.length === 0 ? (
            <Typography align="center" color="text.secondary" py={6}>
              No students found.
            </Typography>
          ) : (
            <Box>
              {groups.map((group, idx) => {
                const sectionKey = `${group.courseName}-${group.batch}`;
                return (
                  <Box key={sectionKey} mb={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ background: '#f5f5f5', borderRadius: 2, px: 2, py: 1, cursor: 'pointer' }} onClick={() => toggleSection(sectionKey)}>
                      <Typography fontWeight={600} color="text.primary">
                        Course: {group.courseName} | Semester {group.semester} | Batch {group.batch}
                      </Typography>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); toggleSection(sectionKey); }}>
                        {openSections[sectionKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections[sectionKey]} timeout="auto" unmountOnExit>
                      <Divider sx={{ my: 1 }} />
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
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultyStudents;
