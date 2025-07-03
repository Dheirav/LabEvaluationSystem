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
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
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

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : theme.spacing(7),
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : theme.spacing(7),
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          backgroundColor: '#1f2937',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 1000,
        }
      }}
    >
      <Box
        sx={{
          p: open ? 2 : 1,
          textAlign: 'center',
          borderBottom: '1px solid #374151',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 50,
          transition: 'all 0.2s'
        }}
      >
        <Avatar
          sx={{
            mx: 'auto',
            mb: open ? 1 : 0,
            bgcolor: '#90caf9',
            width: 40,
            height: 40,
            fontSize: 24,
            transition: 'all 0.2s'
          }}
        >
          {studentName ? studentName[0] : user?.name?.[0] || 'S'}
        </Avatar>
        {open && (
          <>
            <Typography variant="subtitle1" color="white" noWrap>
              {studentName || user?.name || 'Student'}
            </Typography>
            <Typography variant="body2" color="gray" noWrap>
              {user?.user_id}
            </Typography>
          </>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-end' : 'center', p: 0, m: 0, minHeight: 0 }}>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            color: 'white',
            p: 1,
            m: 0,
            minHeight: 0,
            minWidth: 0,
            alignContent: 'center',
          }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ bgcolor: '#374151', my: 0 }} />
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List sx={{ alignItems: 'center' }}>
          {items.map(({ text, path, icon }) => (
            <Tooltip title={!open ? text : ''} placement="right" key={text} arrow>
              <ListItem
                button
                selected={location.pathname === path}
                onClick={() => navigate(path)}
                sx={{
                  justifyContent: open ? 'flex-start' : 'center',
                  alignItems: 'center',
                  px: open ? 2.5 : 0,
                  '&.Mui-selected': {
                    backgroundColor: '#374151',
                    color: '#90caf9',
                    fontWeight: 600
                  },
                  '&:hover': {
                    backgroundColor: '#2d3748',
                    color: '#90caf9'
                  },
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  minHeight: 48,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 0,
                    mr: open ? 3 : 2,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {icon}
                </ListItemIcon>
                {open && <ListItemText primary={text} />}
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>
      <Box sx={{ mb: 2 }}>
        <List>
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: open ? 2.5 : 1,
              '&:hover': { backgroundColor: '#2d3748', color: '#f87171' },
              color: '#f87171',
              borderRadius: 2,
              mx: 1,
              mt: 1
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: 0,
                mr: open ? 3 : 2,
                justifyContent: 'center',
                display: 'flex',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Logout" />}
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}
