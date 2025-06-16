import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import StudentSidebar from '../../components/StudentSidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const StudentEvaluations = () => {
  const { user } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/evaluations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(res.data || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    };
    fetchResults();
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Student - Evaluations" />
      <StudentSidebar studentName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">My Test Results</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
          {loading ? (
            <CircularProgress />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No results found</TableCell>
                  </TableRow>
                ) : (
                  results.map(res => (
                    <TableRow key={res._id}>
                      <TableCell>{res.test?.name}</TableCell>
                      <TableCell>{res.course?.name}</TableCell>
                      <TableCell>{res.date ? new Date(res.date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{res.marksObtained ?? '-'}</TableCell>
                      <TableCell>{res.status}</TableCell>
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

export default StudentEvaluations;
