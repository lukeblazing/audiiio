import React from 'react';
import Box from '@mui/material/Box';
import AppNavbar from './AppNavbar.js';
import { useAuth } from '../authentication/AuthContext.js';
import SignIn from '../authentication/SignIn.js';
import CalendarPage from '../calendar/CalendarPage.js';
import ScrollView from '../scroll-view/ScrollView.js'

function Dashboard() {
  const { isAuthenticated } = useAuth();

  // If not authenticated, only render sign-in page
  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navbar at the top */}
      <AppNavbar />

      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1, // Allows this container to fill the remaining space
          backgroundColor: 'background.default',
          padding: '20px',
          paddingTop: {
            xs: '56px', // 56px for mobile
            sm: '56px', // 56px for small screens
            md: '84px', // 84px for medium and larger screens
          },
        }}
      >
        {/* Calendar at the top */}
        <Box
          sx={{
            width: '100%',
            marginBottom: '20px', // Space between calendar and scroll view
          }}
        >
          <CalendarPage />
        </Box>

        {/* Scrollable view below the calendar */}
        <Box
          sx={{
            flexGrow: 1, // Takes up remaining space
            overflow: 'auto', // Enables scrolling if content overflows
          }}
        >
          <ScrollView />
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
