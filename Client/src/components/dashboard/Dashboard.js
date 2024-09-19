import React from 'react';
import Box from '@mui/material/Box';
import AppNavbar from './AppNavbar.js';

function Dashboard() {
  return (
    <>
      <AppNavbar/>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: 'background.default',
          overflow: 'auto',
        }}
      >
        {/* Dashboard content goes here */}
      </Box>
    </>
  );
}

export default Dashboard;
