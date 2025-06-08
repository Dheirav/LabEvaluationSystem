import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import Header from '../components/Header';
import AdminSidebar from '../components/AdminSidebar';
import { 
  Box, Toolbar, Typography, Grid, Paper, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, Table, 
  TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TablePagination, TableSortLabel
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '../components/ConfirmDialog ';

const UserManagement = () => {
  // Individual registration state
  const [indiv, setIndiv] = useState({ name: '',roll_number: '', user_id: '', password: '', role: 'student' });
  const [indivLoading, setIndivLoading] = useState(false);
  const [indivMsg, setIndivMsg] = useState({ type: '', text: '' });
  // Bulk registration state
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState({ type: '', text: '' });

 
  // New states for user management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [search, setSearch] = useState('');


  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/get_users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

    // Add these functions inside UserManagement component
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Add this function to sort the data

  const sortData = (data) => {
    return data.sort((a, b) => {
      const isAsc = order === 'asc';

      const aValue = (a[orderBy] ?? '').toString();
      const bValue = (b[orderBy] ?? '').toString();
      return isAsc 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  };


  // Handle edit user
  const handleEditClick = (user) => {
    setEditUser(user);
    setOpenDialog(true);
  };

  // Handle update user
  const handleUpdateUser = async () => {
    try {
      await axios.put(`/api/auth/update/users/${editUser._id}`, editUser);
      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

const handleDeleteUser = (userId) => {
  setUserToDelete(userId);
  setDeleteDialogOpen(true);
};

  // Handle delete user
const handleDeleteConfirm = async () => {
  try {
    await axios.delete(`/api/auth/delete/users/${userToDelete}`);
    await fetchUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  }
};

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
      setIndiv({ name: '',roll_number: '', user_id: '', password: '', role: 'student' });
      await fetchUsers(); 
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
      await fetchUsers(); 
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
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Header />
      <AdminSidebar />
      <Box 
        component="main" 
        sx={{
          flexGrow: 1,
          height: '100vh',
          width: '100%',
          overflow: 'auto',
          background: 'linear-gradient(135deg, #282f2f, #becdcd)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 ,flex: 1,minHeight: 0,overflow: 'auto',display: 'flex', flexDirection: 'column' }}>
          <Typography 
            variant="h4" 
            gutterBottom
            color="white"
            sx={{ mb: 2 }}
          >
            User Management
          </Typography>

          <Grid container spacing={3} display={'flex'} sx={{ flex: 1, minHeight: 0 ,height: 0,overflow: 'auto'}}>
            {/* User List Section */}
            <Grid item xs={12} md={7} sm={7} flex={7} sx={{height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column'}}>
              <Paper elevation={8} sx={{ 
                mt: 3, 
                mb: 3,
                backdropFilter: 'blur(20px)',
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 3,
                p: 3,
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                fullWidth: true,
                overflowY: 'auto',
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>
                  Registered Users
                </Typography>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search by name, user ID, roll number, or role"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  sx={{ mb: 2,mt:1, background: 'transparent', borderRadius: 1, width: '100%', fontWeight: 'bold', color: 'black' }}
                  InputProps={{
                    sx: {
                      '& input::placeholder': {
                        color: 'black',
                        opacity: 0.92,
                      }
                    }
                  }}
                />
                <TableContainer sx={{ 
                                maxHeight: 350,
                                overflowY: 'auto',
                                
                                '& .MuiTableSortLabel-root': {
                                  color: 'black',
                                  '&:hover': {
                                    color: 'rgb(55, 79, 113)',
                                  },
                                  '&.Mui-active': {
                                    color: 'rgb(33, 77, 137)',
                                  },
                                },
                                '& .MuiTableSortLabel-icon': {
                                  color: 'rgb(55, 79, 113) !important',
                                }
                              }}>
                  <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: 'rgb(222, 224, 227)',
                          color: '#222',
                          fontWeight: 'bold',
                          py: 1,
                          zIndex: 2,
                          borderTopLeftRadius: 12,      
                          borderBottomLeftRadius: 12,
                        }}
                      >
                        <TableSortLabel
                          active={orderBy === 'user_id'}
                          direction={orderBy === 'user_id' ? order : 'asc'}
                          onClick={() => handleRequestSort('user_id')}
                        >
                          User ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell
                          sx={{
                            backgroundColor: 'rgb(222, 224, 227)',
                            color: '#222',
                            fontWeight: 'bold',
                            py: 1,
                            zIndex: 2
                          }}
                        >
                        <TableSortLabel
                          active={orderBy === 'name'}
                          direction={orderBy === 'name' ? order : 'asc'}
                          onClick={() => handleRequestSort('name')}
                        >
                          Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell
                          sx={{
                            backgroundColor: 'rgb(222, 224, 227)',
                            color: '#222',
                            fontWeight: 'bold',
                            py: 1,
                            zIndex: 2
                          }}
                        >
                        <TableSortLabel
                          active={orderBy === 'roll_number'}
                          direction={orderBy === 'roll_number' ? order : 'asc'}
                          onClick={() => handleRequestSort('roll_number')}
                        >
                          Roll Number
                        </TableSortLabel>
                      </TableCell>
                      <TableCell
                          sx={{
                            backgroundColor: 'rgb(222, 224, 227)',
                            color: '#222',
                            fontWeight: 'bold',
                            py: 1,
                            zIndex: 2
                          }}
                        >
                        <TableSortLabel
                          active={orderBy === 'role'}
                          direction={orderBy === 'role' ? order : 'asc'}
                          onClick={() => handleRequestSort('role')}
                        >
                          Role
                        </TableSortLabel>
                      </TableCell>
                      <TableCell
                      sx={{
                        backgroundColor: 'rgb(222, 224, 227)',
                        color: '#222',
                        fontWeight: 'bold',
                        py: 1,
                        zIndex: 2,
                        borderBottomRightRadius : 12,
                        borderTopRightRadius : 12
                      }}
                    >
                      Actions</TableCell>
                    </TableRow>
                  </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">Loading users...</TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No users found</TableCell>
                        </TableRow>
                      ) : (
                        sortData(
                          users.filter(user =>
                            user.name.toLowerCase().includes(search.toLowerCase()) ||
                            user.user_id.toLowerCase().includes(search.toLowerCase()) ||
                            user.roll_number.toLowerCase().includes(search.toLowerCase()) ||
                            user.role.toLowerCase().includes(search.toLowerCase()) 
                          )
                        )
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((user) => (
                            <TableRow key={user._id}>
                              <TableCell>{user.user_id}</TableCell>
                              <TableCell>{user.name}</TableCell>
                              <TableCell>{user.roll_number}</TableCell>
                              <TableCell>
                              {user.role === 'student' ? (
                                <span>Student</span>
                              ) : user.role === 'faculty' ? (
                                <span>Faculty</span>
                              ) : (
                                <span>Admin</span>
                              )}
                            </TableCell>
                              <TableCell>
                                <IconButton onClick={() => handleEditClick(user)}>
                                  <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDeleteUser(user._id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={users.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{
                    color: 'black',
                    '.MuiTablePagination-select': {
                      color: 'black'
                    },
                    '.MuiTablePagination-selectIcon': {
                      color: 'black'
                    },
                    '.MuiTablePagination-displayedRows': {
                      color: 'black'
                    }
                  }}
                />
              </Paper>
            </Grid>

            {/* Edit User Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
              <DialogTitle>Edit User</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  label="Name"
                  value={editUser?.name || ''}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  sx={{ mt: 2 }}
                />
                <TextField
                  fullWidth
                  label="Roll Number"
                  value={editUser?.roll_number || ''}
                  onChange={(e) => setEditUser({ ...editUser, roll_number: e.target.value })}
                  sx={{ mt: 2 }}
                />
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editUser?.role || ''}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="faculty">Faculty</MenuItem>
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button onClick={handleUpdateUser} variant="contained">Save</Button>
              </DialogActions>
            </Dialog>

            {/* Individual Registration Card */}
            <Grid item xs={12} md ={5} sm={5} flex={5} sx = {{height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column'}}>
               <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  mt: 3,
                  gap: 2,
                  height: '100%',
                  minHeight: 0,
                  overflow: 'auto',
                }}>
                <Paper 
                  elevation={8}
                  sx={{
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255,255,255,0.10)',
                    borderRadius: 3,
                    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                    p: 3,
                    width: '90%',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#222',
                    flexShrink: 0,
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
                        <TextField
                          fullWidth
                          label="Roll Number"
                          name="roll_number"
                          value={indiv.roll_number}
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
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={indivLoading}
                            sx={{
                              mt: 1,
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
            {/* Bulk Upload Card */}
              <Paper 
                elevation={8}
                sx={{
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: 3,
                  boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                  p: 3,
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#222',
                  transition: 'transform 0.3s ease',
                  width: '90%',
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  '&:hover': {
                    transform: 'scale(1.01)'
                  },
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', gap: 1 }}>
                  <CloudUploadIcon />
                  Bulk Upload
                </Typography>
                <form onSubmit={handleBulkSubmit} >
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      
                      borderColor: 'rgba(0,0,0,0.2)',
                      color: '#222',
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
              </Box>
            </Grid>
          </Grid>
          <ConfirmDialog
            open={deleteDialogOpen}
            title="Delete User"
            message="Are you sure you want to delete this user? This action cannot be undone."
            onConfirm={handleDeleteConfirm}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setUserToDelete(null);
            }}
            confirmText="Delete"
            cancelText="Cancel"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default UserManagement;