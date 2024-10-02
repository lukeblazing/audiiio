import React from 'react';
import Box from '@mui/material/Box';
import AppNavbar from './AppNavbar.js';
import { useAuth } from '../authentication/AuthContext.js';
import SignIn from '../authentication/SignIn.js';

function Dashboard() {
  const { isAuthenticated } = useAuth();

  // If not authenticated, only render sign-in page
  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <>
      <AppNavbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: 'background.default',
          overflow: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        </Box>
      </Box>
    </>
  );
}

export default Dashboard;
