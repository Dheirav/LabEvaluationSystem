import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper, CircularProgress, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FacultySidebar from '../../components/FacultySidebar';
import Header from '../../components/Header';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const FacultyQuestionPool = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuestionPool = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/faculty/question-pool', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data || []);
      } catch {
        setCourses([]);
        setError('Failed to fetch question pool');
      }
      setLoading(false);
    };
    fetchQuestionPool();
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <Header title="Faculty - Question Pool" />
      <FacultySidebar facultyName={user?.name} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom color="white">Question Pool</Typography>
        <Paper sx={{ p: 3, borderRadius: 3, mt: 2 }}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : courses.length === 0 ? (
            <Typography>No courses found.</Typography>
          ) : (
            courses.map(course => (
              <Accordion key={course._id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{course.name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {course.tests && course.tests.length > 0 ? (
                    course.tests.map(test => (
                      <Accordion key={test._id}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>{test.name}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {test.questions && test.questions.length > 0 ? (
                              test.questions.map(q => (
                                <ListItem key={q._id}>
                                  <ListItemText primary={q.text} />
                                  {/* Add edit/delete buttons here */}
                                </ListItem>
                              ))
                            ) : (
                              <ListItem>
                                <ListItemText primary="No questions in this test." />
                              </ListItem>
                            )}
                          </List>
                          <Button variant="outlined" sx={{ mt: 1 }}>Add Question</Button>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Typography>No tests in this course.</Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default FacultyQuestionPool;
