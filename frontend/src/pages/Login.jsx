import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import '../App.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [user_id, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(user_id, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else if (user.role === 'student') navigate('/student');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        const msg = err.response.data.message.toLowerCase();
        if (msg.includes('user')) {
          setError('Invalid User ID. Please check your User ID and try again.');
        } else if (msg.includes('password')) {
          setError('Incorrect password. Please try again.');
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError('Login failed. Please check your User ID and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        flexGrow: 1,
        minHeight: '97.5vh',
        background: 'linear-gradient(135deg, #282f2f, #becdcd)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <Typography
        variant="h3"
        align="center"
        sx={{
          fontWeight: 700,
          color: '#fff',
          mb: 4,
          letterSpacing: 1.5,
          textShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        DCSE Lab Evaluation System
      </Typography>
      <Paper
        elevation={8}
        sx={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255,255,255,0.10)',
          borderRadius: 3,
          boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
          p: { xs: 3, sm: 5 },
          width: '100%',
          maxWidth: 400,
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#222',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.01)'
          }
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: '#222'
          }}
        >
          Sign in to your account
        </Typography>
        {error && (
          <Box
            sx={{
              background: 'rgba(255,0,0,0.1)',
              color: '#b71c1c',
              p: 1.5,
              borderRadius: 1,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              fontWeight: 500,
              textAlign: 'center',
              fontSize: '1rem',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <span style={{ marginRight: 8 }}>⚠️</span>
            {error}
          </Box>
        )}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <TextField
            label="User ID"
            variant="outlined"
            value={user_id}
            onChange={(e) => setUserId(e.target.value)}
            required
            autoComplete="off"
            fullWidth
            InputLabelProps={{ style: { fontWeight: 600 } }}
            sx={{
              input: { color: '#222', background: 'rgba(255,255,255,0.1)', borderRadius: 1 },
              label: { color: '#222' },
            }}
          />
          <TextField
            label="Password"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
            fullWidth
            InputLabelProps={{ style: { fontWeight: 600 } }}
            sx={{
              input: { color: '#222', background: 'rgba(255,255,255,0.1)', borderRadius: 1 },
              label: { color: '#222' },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              py: 1.5,
              fontWeight: 600,
              fontSize: '1rem',
              borderRadius: 2,
              mt: 1,
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              '&:hover': {
                background: 'rgba(0,0,0,0.5)'
              },
              '&:disabled': {
                opacity: 0.6
              }
            }}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
