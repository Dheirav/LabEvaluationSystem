import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, CircularProgress, Paper, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';
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
    <Box className="flex min-h-screen bg-gradient-to-br from-[#282f2f] to-[#becdcd]">
      <Header title="Faculty - Students" />
      <FacultySidebar facultyName={user?.name} />
      <main className="flex-1 p-4 sm:p-8 overflow-auto">
        <Typography variant="h4" gutterBottom className="text-white font-bold mb-6">
          My Students (by Course & Batch)
        </Typography>
        <Paper className="p-4 rounded-2xl bg-white/10 shadow-lg">
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
          )}
        </Paper>
      </main>
    </Box>
  );
};

export default FacultyStudents;
