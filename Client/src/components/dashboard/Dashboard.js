import React from 'react';
import Box from '@mui/material/Box';
import AppNavbar from './AppNavbar.js';
import { useAuth } from '../authentication/AuthContext.js';
import SignIn from '../authentication/SignIn.js';
import CalendarPage from '../calendar/CalendarPage.js';
import ScrollView from '../scroll-view/ScrollView.js';

function Dashboard() {
  const { isAuthenticated } = useAuth();

  // If not authenticated, only render sign-in page
  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Navbar at the top */}
      <AppNavbar />

      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          backgroundColor: 'background.default',
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '20px',
          paddingTop: {
            xs: 'calc(56px + 20px)',  // Navbar height (xs) + 20px padding
            sm: 'calc(56px + 20px)',  // Navbar height (sm) + 20px padding
            md: 'calc(56px + 20px)',  // Navbar height (md and above) + 20px padding
          },
          boxSizing: 'border-box',
         // gap: '20px',  // Consistent spacing between children
          overflow: 'hidden',  // Prevent content overflow
        }}
      >
<Box
  sx={{
    width: '100%',
    maxWidth: '1000px',
    maxHeight: 'calc(100vh - 56px - 40px)',  // Adjust based on navbar height and padding
    aspectRatio: '5 / 4',  // Default aspect ratio for smaller screens
    position: 'relative',
    margin: '0 auto',  // Center the box horizontally
    '&::before': {
      content: '""',
      display: 'block',
      paddingBottom: '80%', // Larger height-to-width ratio for small screens (5:4)
    },
    '& > *': {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    // Media queries for larger screens to enforce 16:9 aspect ratio
    '@media (min-width: 600px)': {
      aspectRatio: '16 / 9',
      '&::before': {
        paddingBottom: '56.25%',  // 16:9 aspect ratio
      },
    },
  }}
>
  <CalendarPage />
</Box>


        {/* Scrollable view below the calendar */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
          }}
        >
          <ScrollView />
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
