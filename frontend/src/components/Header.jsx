import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Header = ({ title = "Lab Evaluation System - Admin" }) => (
  <AppBar 
    position="fixed" 
    sx={{
      zIndex: (theme) => theme.zIndex.drawer + 1
    }}
  >
    <Toolbar>
      <Typography variant="h6" noWrap>
        {title}
      </Typography>
    </Toolbar>
  </AppBar>
);

export default Header;