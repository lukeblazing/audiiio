import React from 'react';
import Box from '@mui/material/Box';
import AppNavbar from './AppNavbar.js';
import { useAuth } from '../authentication/AuthContext.js';
import SignIn from '../authentication/SignIn.js';
import CalendarPage from '../calendar/CalendarPage.js';

function Dashboard() {
  const { isAuthenticated } = useAuth();

  // If not authenticated, only render sign-in page
  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppNavbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: 'background.default',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // Centers content vertically
          alignItems: 'center',     // Centers content horizontally (optional)
          padding: '20px',
          paddingTop: {
            xs: `56px`, // 56px for mobile
            sm: `56px`, // 56px for small screens
            md: '84px', // 84px for medium and larger screens
          },
        }}
      >
        <CalendarPage />
      </Box>
    </Box>
  );
}

export default Dashboard;
