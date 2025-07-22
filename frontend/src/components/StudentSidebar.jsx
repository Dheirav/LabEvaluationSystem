import { useState } from 'react';
import {
  Avatar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  ListItemIcon,
  Tooltip,
  Divider,
  IconButton,
  useTheme
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import QuizIcon from '@mui/icons-material/Quiz';

const drawerWidth = 220;

export default function StudentSidebar({ studentName }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const items = [
    { text: 'Dashboard', path: '/student', icon: <DashboardIcon /> },
    { text: 'My Courses', path: '/student/courses', icon: <AssignmentIcon /> },
    { text: 'My Study Materials', path: '/student/materials', icon: <AssignmentIcon /> },
    { text: 'Evaluations', path: '/student/evaluations', icon: <AssignmentIcon /> },
    { text: 'Schedule', path: '/student/schedule', icon: <ScheduleIcon /> },
    { text: 'Available Tests', path: '/student/tests', icon: <QuizIcon /> },
  ];

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        // Optionally handle error (e.g., network issues)
      }
    }
    localStorage.removeItem('token');
    if (window.axios) {
      delete window.axios.defaults.headers.common['Authorization'];
    }
    if (typeof window.logout === 'function') {
      window.logout();
    }
    navigate('/login');
  };

  // Optionally decode student info from token
  let user = null;
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      user = JSON.parse(jsonPayload);
    } catch {
      user = null;
    }
  }

  // ...existing code...
  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : 60,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 60,
          boxSizing: 'border-box',
          background: '#222',
          color: '#fff',
          borderRight: '1px solid #333',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', px: 2, py: 1 }}>
        {open && <Typography variant="h6" noWrap>{studentName}</Typography>}
        <IconButton onClick={handleDrawerToggle} sx={{ color: '#fff' }}>
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ bgcolor: '#444' }} />
      <List>
        {items.map((item, idx) => (
          <Tooltip key={item.text} title={open ? '' : item.text} placement="right">
            <ListItem button selected={location.pathname === item.path} onClick={() => navigate(item.path)} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>{item.icon}</ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </ListItem>
          </Tooltip>
        ))}
      </List>
      <Divider sx={{ bgcolor: '#444', mt: 'auto' }} />
      <List>
        <ListItem button onClick={handleLogout} sx={{ py: 1.5 }}>
          <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
          {open && <ListItemText primary="Logout" />}
        </ListItem>
      </List>
    </Drawer>
  );
}
