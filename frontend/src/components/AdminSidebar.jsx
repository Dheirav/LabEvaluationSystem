import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Toolbar, 
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
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const drawerWidth = 240;

const AdminSidebar = () => {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();
  
  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const items = [
    { text: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
    { text: 'Evaluations', path: '/admin/evaluations', icon: <AssignmentIcon /> },
    { text: 'Students', path: '/admin/students', icon: <PeopleIcon /> },
    { text: 'Faculty', path: '/admin/faculty', icon: <SchoolIcon /> },
    { text: 'Reports', path: '/admin/reports', icon: <BarChartIcon /> },
    { text: 'User Management', path: '/admin/registrations', icon: <PersonAddIcon /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };


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
          justifyContent: 'space-between'
        }
      }}
    >
      <div>
        <Toolbar sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: open ? 'flex-end' : 'center',
          px: [1]
        }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
        <Divider sx={{ bgcolor: '#374151' }} />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {items.map(({ text, path, icon }) => (
              <Tooltip title={!open ? text : ''} placement="right" key={text} arrow>
                <ListItem
                  button
                  selected={location.pathname === path}
                  onClick={() => navigate(path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
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
                    my: 0.5
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: 'inherit', 
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center'
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
      </div>
      <Box sx={{ mb: 2 }}>
        <Divider sx={{ bgcolor: '#374151' }} />
        <List>
          <ListItem 
            button 
            onClick={handleLogout} 
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
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
                mr: open ? 3 : 'auto',
                justifyContent: 'center'
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
};
export default AdminSidebar;
