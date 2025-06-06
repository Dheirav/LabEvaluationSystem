import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';
import Header from '../components/Header';
import AdminSidebar from '../components/AdminSidebar';
import { Box, Toolbar, Typography, Grid, Paper, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { BoltRounded } from '@mui/icons-material';

const UserRegistration = () => {
  // Individual registration state
  const [indiv, setIndiv] = useState({ name: '', user_id: '', password: '', role: 'student' });
  const [indivLoading, setIndivLoading] = useState(false);
  const [indivMsg, setIndivMsg] = useState({ type: '', text: '' });
  // Bulk registration state
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState({ type: '', text: '' });

  // Handle individual form change
  const handleIndivChange = (e) => {
    setIndiv({ ...indiv, [e.target.name]: e.target.value });
  };

  // Submit individual registration
  const handleIndivSubmit = async (e) => {
    e.preventDefault();
    setIndivLoading(true);
    setIndivMsg({ type: '', text: '' });
    try {
      await axios.post('/api/auth/register/individual', indiv);
      setIndivMsg({ type: 'success', text: 'User registered!' });
      setIndiv({ name: '', user_id: '', password: '', role: 'student' });
    } catch (err) {
      setIndivMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setIndivLoading(false);
    }
  };

  // Handle bulk file change
  const handleBulkFile = (e) => {
    setBulkFile(e.target.files[0]);
  };

  // Submit bulk registration
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkMsg({ type: '', text: '' });
    if (!bulkFile) {
      setBulkMsg({ type: 'error', text: 'No file selected' });
      return;
    }
    setBulkLoading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);
    try {
      const res = await axios.post('/api/auth/register/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBulkMsg({
        type: res.data.errors.length ? 'warning' : 'success',
        text: `Bulk registration complete: ${res.data.created.length} users created, ${res.data.errors.length} errors`,
      });
      setBulkFile(null);
    } catch (err) {
      setBulkMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setBulkLoading(false);
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
      }}
    >
      <Header />
      <AdminSidebar />
      
      <Box 
        component="main" 
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          background: 'linear-gradient(135deg, #282f2f, #becdcd)',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="h4" 
            gutterBottom
            color="white"
            sx={{ mb: 4 }}
          >
            User Registration
          </Typography>

          <Grid container spacing={3} sx ={{height: '100%' , alignItems: 'stretch'}}>
            {/* Individual Registration Card */}
            <Grid item xs={12} md={6} sx = {{ display: 'flex' , width: '100%',height: '100%' }}>
              <Paper 
                elevation={8}
                sx={{
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: 3,
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                  p: { xs: 3, sm: 5 },
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#222',
                  width: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.01)'
                  },
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAddIcon />
                  Individual Registration
                </Typography>
                <form onSubmit={handleIndivSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="User ID"
                        name="user_id"
                        value={indiv.user_id}
                        onChange={handleIndivChange}
                        required
                        variant="outlined"
                        sx={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={indiv.name}
                        onChange={handleIndivChange}
                        required
                        variant="outlined"
                        sx={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl 
                        fullWidth 
                        required 
                        variant="outlined" 
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          '& .MuiInputLabel-shrink': {
                            transform: 'translate(14px, -9px) scale(0.75)',
                          },
                          '& .MuiOutlinedInput-root': {
                            width: '100%',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                          }
                        }}
                      >
                        <InputLabel>Role</InputLabel>
                        <Select
                          name="role"
                          value={indiv.role}
                          onChange={handleIndivChange}
                          label="Select Role"
                        >
                          <MenuItem value="student">Student</MenuItem>
                          <MenuItem value="faculty">Faculty</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Password"
                        name="password"
                        value={indiv.password}
                        onChange={handleIndivChange}
                        required
                        variant="outlined"
                        sx={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      />
                    </Grid>
                    {/* Move the button to a new row and center it */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={indivLoading}
                          sx={{
                            mt: 2,
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.3)',
                            },
                            minWidth: '150px',
                          }}
                        >
                          {indivLoading ? 'Registering...' : 'Register User'}
                        </Button>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      {indivMsg.text && (
                        <Typography color={indivMsg.type === 'error' ? 'error' : indivMsg.type === 'success' ? 'green' : 'orange'} 
                          fontWeight={600} sx={{ mt: 2 }} 
                          backgroundColor="rgba(255,255,255,0.5)"
                          p={1} 
                          borderRadius={1}>
                          {indivMsg.text}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>

            {/* Bulk Upload Card */}
            <Grid item xs={12} md={6} sx = {{ display: 'flex', width: '100%' , height: '100%' }}>
              <Paper 
                elevation={8}
                sx={{
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: 3,
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                  p: { xs: 3, sm: 5 },
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#222',
                  transition: 'transform 0.3s ease',
                  height: '80%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    transform: 'scale(1.01)'
                  },
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUploadIcon />
                  Bulk Upload
                </Typography>
                <form onSubmit={handleBulkSubmit} style={{ width: '100%' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      mt: 2,
                      borderColor: 'rgba(0,0,0,0.2)',
                      color: '#222',
                      alignContent: 'center',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      display: 'flex',
                      '&:hover': {
                        borderColor: 'rgba(0,0,0,0.3)',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    Choose File
                    <input
                      type="file"
                      hidden
                      accept=".xlsx,.xls,.pdf,.json,.csv"
                      onChange={handleBulkFile}
                    />
                  </Button>
                  <Typography variant="body2" 
                    sx={{ mt: 2 , alignContent: 'center',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      display: 'flex', }}>
                    {bulkFile ? bulkFile.name : 'No file selected'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={bulkLoading}
                      sx={{
                        mt: 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignContent: 'center',
                        flexDirection: 'column',
                        display: 'flex',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.3)',
                        },
                        minWidth: '150px',
                      }}
                    >
                      {bulkLoading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </Box>
                  {bulkMsg.text && (
                    <Typography color={bulkMsg.type === 'error' ? 'error' : bulkMsg.type === 'success' ? 'green' : 'orange'} 
                          fontWeight={600} sx={{ mt: 2  }} 
                          backgroundColor="rgba(255,255,255,0.5)"
                          p={1} 
                          borderRadius={1}>
                          {bulkMsg.text}
                        </Typography>
                  )}
                </form>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default UserRegistration;