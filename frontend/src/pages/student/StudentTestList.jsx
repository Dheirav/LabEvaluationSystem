import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, CircularProgress, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import StudentSidebar from '../../components/StudentSidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentTestList = () => {
  const { user } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/available-tests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTests(res.data || []);
      } catch (err) {
        setTests([]);
        setError('Failed to fetch available tests');
      }
      setLoading(false);
    };
    fetchTests();
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Student - Available Tests" />
      <StudentSidebar studentName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">Available Tests</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2, mb: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center">{error}</Typography>
          ) : tests.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 8 }}>
              No available tests found.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test._id}>
                    <TableCell>{test.name}</TableCell>
                    <TableCell>{test.course?.name || '-'}</TableCell>
                    <TableCell>{test.date ? new Date(test.date).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/student/test/${test._id}`)}
                      >
                        Start Test
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default StudentTestList;
