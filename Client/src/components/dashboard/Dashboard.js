import React from 'react';
import Box from '@mui/material/Box';
import AppNavbar from './AppNavbar.js';
import { useAuth } from '../authentication/AuthContext.js';
import SignIn from '../authentication/SignIn.js';
import CalendarPage from '../calendar/CalendarPage.js';

function Dashboard() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', // Full viewport height
        overflow: 'hidden', // Prevents unwanted scrolling
        position: 'fixed', // Critical for iOS to prevent scrolling
        width: '100vw', // Ensure it spans full width
      }}
    >
      {/* Navbar at the top */}
      <AppNavbar />

      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Prevents flex issues
          marginTop: '10vh', // Buffer from the top by 10%
          maxHeight: '50vh', // Limit max height to 50% of viewport height
        }}
      >
        <CalendarPage />
      </Box>
    </Box>
  );
}

export default Dashboard;
