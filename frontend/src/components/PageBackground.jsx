import React from 'react';
import { Box } from '@mui/material';

const PageBackground = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '97.5vh',
        background: 'linear-gradient(135deg, #282f2f, #becdcd)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      {children}
    </Box>
  );
};

export default PageBackground;