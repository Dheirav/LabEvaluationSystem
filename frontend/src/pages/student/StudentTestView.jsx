import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, TextField, Paper, CircularProgress } from '@mui/material';

const StudentTestView = () => {
  const { testId } = useParams();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/student/start-test/${testId}`);
        setQuestions(res.data.questions || []);
        setAnswers(res.data.questions ? res.data.questions.map(() => '') : []);
        setAttemptId(res.data.attemptId);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test');
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [testId]);

  const handleAnswerChange = (idx, value) => {
    setAnswers(a => a.map((ans, i) => (i === idx ? value : ans)));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await axios.patch(`/api/student/attempt/${attemptId}`, { answers });
      alert('Answers submitted!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answers');
    }
    setSubmitting(false);
  };

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;
  if (error) return (
    <Box p={4} textAlign="center">
      <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      {error.includes('Not enough unique questions') && (
        <Typography color="warning.main">This test cannot be started because there are not enough unique questions as set by your instructor. Please contact your instructor or try again later.</Typography>
      )}
    </Box>
  );

  return (
    <Box maxWidth={800} mx="auto" p={4}>
      <Typography variant="h4" gutterBottom>Test</Typography>
      {questions.map((q, idx) => (
        <Paper key={q._id || idx} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">Q{idx + 1}: {q.title}</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>{q.description}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Topic: {q.topic} | Difficulty: {q.difficulty} | Tags: {q.tags?.join(', ')} | Marks: {q.marks}
          </Typography>
          <TextField
            label="Your Answer"
            multiline
            minRows={2}
            fullWidth
            value={answers[idx] || ''}
            onChange={e => handleAnswerChange(idx, e.target.value)}
            variant="outlined"
          />
        </Paper>
      ))}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={submitting}
      >
        Submit Answers
      </Button>
    </Box>
  );
};

export default StudentTestView;
