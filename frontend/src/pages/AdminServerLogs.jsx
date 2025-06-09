import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  TextField,
  Grid,
  Toolbar,
  TablePagination,
  TableContainer
} from '@mui/material';
import AdminSidebar from '../components/AdminSidebar';
import { debounce } from 'lodash';

const AdminServerLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [user, setUser] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = [];
      if (search) params.push(`details=${encodeURIComponent(search)}`);
      if (user) params.push(`user=${encodeURIComponent(user)}`);
      if (action) params.push(`action=${encodeURIComponent(action)}`);
      if (from) params.push(`from=${from}`);
      if (to) params.push(`to=${to}`);
      params.push(`page=${page}`);
      params.push(`rowsPerPage=${rowsPerPage}`);
      const query = params.length ? `?${params.join('&')}` : '';
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/logs/get_logs${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data && data.logs) {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setTotal(data.pagination?.total || 0);
      } else {
        setLogs(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
      }
    } catch (e) {
      console.error("Error fetching logs:", e);
      setLogs([]);
      setTotal(0);
    }
    setLoading(false);
  };

  const debouncedFetch = debounce(() => {
    fetchLogs();
  }, 500);

  useEffect(() => {
    setPage(0);
  }, [search, user, action, from, to]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, user, action, from, to, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4" gutterBottom color="white" sx={{ mb: 2 }}>
          Server Logs
        </Typography>
        <Paper
          elevation={8}
          sx={{
            p: 3,
            borderRadius: 3,
            mx: 'auto',
            mt: 2,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            height: 'calc(100vh - 180px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                label="User"
                value={user}
                onChange={e => setUser(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Action"
                value={action}
                onChange={e => setAction(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="From"
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="To"
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Search Details"
                value={search}
                onChange={e => setSearch(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <TableContainer
                  component={Paper}
                  sx={{
                    maxHeight: 'calc(100vh - 330px)',
                    boxShadow: 'none',
                    bgcolor: 'transparent'
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: '#f5f5f5',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                          }}
                        >
                          Timestamp
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: '#f5f5f5',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                          }}
                        >
                          User
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: '#f5f5f5',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                          }}
                        >
                          Action
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor: '#f5f5f5',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                          }}
                        >
                          Details
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No logs found</TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log, idx) => (
                          <TableRow
                            key={idx}
                            sx={{
                              '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                            }}
                          >
                            <TableCell>
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                            </TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>{log.action}</TableCell>
                            <TableCell>{log.details}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: '1px solid rgba(224, 224, 224, 1)',
                  mt: 'auto'
                }}
              />
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminServerLogs;
