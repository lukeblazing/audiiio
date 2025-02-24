import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AppNavbar from './AppNavbar.js';
import { useAuth } from '../authentication/AuthContext.js';
import SignIn from '../authentication/SignIn.js';
import CalendarPage from '../calendar/CalendarPage.js';
import MagicWandIcon from '@mui/icons-material/AutoFixHigh'; // AI Magic Wand Icon

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
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        width: '100vw',
      }}
    >
      {/* Navbar at the top */}
      <AppNavbar />

      {/* Buttons Container - Positioned right below the navbar */}
      <Box
        sx={{
          position: 'absolute', // Keeps it positioned correctly
          top: 60, // Below navbar
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center', // Centered row
          alignItems: 'center',
          gap: '12px', // Even spacing
          zIndex: 10, // Ensures it's above the calendar
          pointerEvents: 'auto', // Fix for clickability
        }}
      >
        {/* Remove Event Button */}
        <Button 
          variant="outlined" 
          color="error" 
          sx={{ 
            width: 150, 
            height: 50, 
            borderRadius: '12px', 
            minWidth: 'auto',
            transition: 'transform 0.2s ease-in-out',
            '&:active': {
              transform: 'scale(0.7)',
            },
          }}
          disableRipple
          onClick={() => console.log('Remove Event Clicked')}
        >
          Remove Event
        </Button>

        {/* Add Event Button */}
        <Button 
          variant="outlined" 
          color="primary" 
          sx={{ 
            width: 150, 
            height: 50, 
            borderRadius: '12px', 
            minWidth: 'auto',
            transition: 'transform 0.2s ease-in-out',
            '&:active': {
              transform: 'scale(0.7)',
            },
          }}
          disableRipple
          onClick={() => console.log('Add Event Clicked')}
        >
          Add Event
        </Button>

        {/* AI Magic Wand Button with Gradient Outline */}
        <IconButton 
          sx={{ 
            width: 50, 
            height: 50, 
            borderRadius: '12px',
            minWidth: 'auto',
            border: '2px solid transparent', // Transparent border initially
            background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, rgb(255, 0, 140), #FF69B4, rgb(247, 0, 255), rgb(245, 89, 245)) border-box', // Gradient outline
            color: 'rgb(255, 0, 140)', // Matches gradient
            transition: 'transform 0.2s ease-in-out',
            '&:active': {
              transform: 'scale(0.7)',
            },
          }}
          disableRipple
          onClick={() => console.log('AI Clicked')}
        >
          <MagicWandIcon />
        </IconButton>
      </Box>

      {/* Calendar Container */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          marginTop: '120px', // Push the calendar down below buttons
          maxHeight: '50vh',
          zIndex: 1, // Ensures it's below buttons
        }}
      >
        <CalendarPage />
      </Box>
    </Box>
  );
}

export default Dashboard;
