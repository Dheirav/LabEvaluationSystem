import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FacultyEvaluations = () => {
  const { user } = useContext(AuthContext);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradeDialog, setGradeDialog] = useState(false);
  const [selectedEval, setSelectedEval] = useState(null);
  const [marks, setMarks] = useState('');

  useEffect(() => {
    const fetchEvaluations = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/evaluations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvaluations(res.data || []);
      } catch {
        setEvaluations([]);
        setError('Failed to fetch evaluations');
      }
      setLoading(false);
    };
    fetchEvaluations();
  }, []);

  const handleGrade = (evalObj) => {
    setSelectedEval(evalObj);
    setMarks('');
    setGradeDialog(true);
  };

  const handleGradeSubmit = async () => {
    if (!marks) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/faculty/evaluations/${selectedEval._id}/grade`, { marks }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGradeDialog(false);
      setSelectedEval(null);
      setMarks('');
      // Refresh evaluations
      const res = await axios.get('/api/faculty/evaluations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvaluations(res.data || []);
    } catch {
      setError('Failed to submit grade');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Faculty - Evaluations" />
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">My Evaluations</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course</TableCell>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evaluations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No evaluations found</TableCell>
                  </TableRow>
                ) : (
                  evaluations.map(ev => (
                    <TableRow key={ev._id}>
                      <TableCell>{ev.courseName || ev.course?.name}</TableCell>
                      <TableCell>{ev.testName || ev.test?.name}</TableCell>
                      <TableCell>{ev.status}</TableCell>
                      <TableCell>{ev.dueDate ? new Date(ev.dueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        {ev.status === 'pending' && (
                          <Button variant="outlined" size="small" onClick={() => handleGrade(ev)}>
                            Grade
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Paper>
        <Dialog open={gradeDialog} onClose={() => setGradeDialog(false)}>
          <DialogTitle>Grade Evaluation</DialogTitle>
          <DialogContent>
            <TextField
              label="Marks"
              type="number"
              value={marks}
              onChange={e => setMarks(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGradeDialog(false)}>Cancel</Button>
            <Button onClick={handleGradeSubmit} variant="contained">Submit</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default FacultyEvaluations;
