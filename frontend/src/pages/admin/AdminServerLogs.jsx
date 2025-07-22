import { useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
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
  TablePagination,
  TableContainer,
  Button,
  Stack,
  Select,
  MenuItem, 
  InputLabel, 
  FormControl
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear'; 
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'; 
import DownloadIcon from '@mui/icons-material/Download';
import AdminSidebar from '../../components/AdminSidebar';
import { debounce } from 'lodash';

const AdminServerLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [user_id, setUser] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  // Dialog state
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState('');
  const [showResultDialog, setShowResultDialog] = useState(false);

    const handleClearFilters = () => {
    setSearch('');
    setFrom('');
    setTo('');
    setUser('');
    setAction('');
    
  };

  const handleClearLogs = async () => {
    setActionLoading(true);
    setActionResult('');
    try {
      const params = [];
      if (search) params.push(`details=${encodeURIComponent(search)}`);
      if (user_id) params.push(`user=${encodeURIComponent(user_id)}`);
      if (action) params.push(`action=${encodeURIComponent(action)}`);
      if (from) params.push(`from=${from}`);
      if (to) params.push(`to=${to}`);
      const query = params.length ? `?${params.join('&')}` : '';
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/logs/delete_logs${query}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        fetchLogs();
        setActionResult(`Successfully deleted ${data.deletedCount} logs.`);
      } else {
        setActionResult('Failed to delete logs: ' + (data.message || 'Unknown error'));
      }
    } catch (e) {
      setActionResult('Error deleting logs: ' + e.message);
    }
    setActionLoading(false);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = [];
      if (search) params.push(`details=${encodeURIComponent(search)}`);
      if (user_id) params.push(`user=${encodeURIComponent(user_id)}`);
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
  }, [search, user_id, action, from, to]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [search, user_id, action, from, to, page, rowsPerPage]);

useEffect(() => {
  const interval = setInterval(() => {
    fetchLogs();
  }, 5000); // every 5 seconds

  return () => clearInterval(interval);
}, [search, user_id, action, from, to, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const downloadLogs = (format) => {
    const token = localStorage.getItem('token');
    fetch(`/api/logs/download/${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `server_logs.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #282f2f, #becdcd)' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 ,overflow: 'auto'}}>
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
            maxHeight: '80vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(20px)',
            background: 'rgba(255,255,255,0.2)',            
            boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#222',
          }}
        >
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                label="User"
                value={user_id}
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
        
          <Stack 
            direction="row" 
            spacing={2} 
            sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="subtitle1" sx={{ fontStyle: 'italic', backgroundColor: 'rgba(245, 245, 245, 0.5)', padding: '8px', borderRadius: '4px' }}>   
              {total} {total === 1 ? 'log' : 'logs'} found
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="download-format-label">Download Format</InputLabel>
              <Select
                labelId="download-format-label"
                value={downloadFormat}
                label="Download Format"
                onChange={e => setDownloadFormat(e.target.value)}
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => downloadLogs(downloadFormat)}
              size="small"
            >
              Download
            </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                size="small"
              >
                Clear Filters
              </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setClearDialogOpen(true)}
            size="small"
            disabled={total === 0}
          >
            Delete {total > 0 ? `${total} ` : ''}Selected Logs
          </Button>
        {/* Clear Logs Confirm Dialog */}
        <ConfirmDialog
          open={clearDialogOpen}
          title="Clear Server Logs"
          message={(() => {
            if (search || user_id || action || from || to) {
              let msg = 'Are you sure you want to delete the filtered logs';
              if (user_id) msg += ` for user "${user_id}"`;
              if (action) msg += ` with action "${action}"`;
              if (search) msg += ` containing "${search}"`;
              if (from || to) {
                msg += ' from the date range';
                if (from) msg += ` starting ${new Date(from).toLocaleDateString()}`;
                if (to) msg += ` until ${new Date(to).toLocaleDateString()}`;
              }
              msg += '? This action cannot be undone.';
              return msg;
            } else {
              return 'Are you sure you want to delete ALL logs? This action cannot be undone.';
            }
          })()}
          confirmText={actionLoading ? 'Clearing...' : 'Clear'}
          cancelText="Cancel"
          onCancel={() => { setClearDialogOpen(false); setActionResult(''); }}
          onConfirm={async () => {
            await handleClearLogs();
            setClearDialogOpen(false);
            setShowResultDialog(true);
          }}
        />
        {/* Result Dialog */}
        <ConfirmDialog
          open={showResultDialog && !!actionResult}
          title="Action Result"
          message={actionResult}
          confirmText="OK"
          cancelText=""
          onCancel={() => { setShowResultDialog(false); setActionResult(''); }}
          onConfirm={() => { setShowResultDialog(false); setActionResult(''); }}
        />
            </Stack>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: 'none',
                    bgcolor: 'transparent'
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Timestamp</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>User</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>Details</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>IP Address</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'rgba(245,245,245,1)', position: 'sticky', top: 0, zIndex: 1 }}>System Info</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No logs found</TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log, idx) => (
                          <TableRow
                            key={idx}
                            sx={{ backgroundColor: log.details && log.details.includes('ALERT') ? 'rgba(255, 0, 0, 0.5)' : 'transparent' }}
                          >
                            <TableCell>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</TableCell>
                            <TableCell>{log.user_id}</TableCell>
                            <TableCell>{log.action}</TableCell>
                            <TableCell>{log.details}</TableCell>
                            <TableCell>{log.ip || 'N/A'}</TableCell>
                            <TableCell>{log.system_id || 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              
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
                  mt: 'auto',
                  height: '64px'
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
