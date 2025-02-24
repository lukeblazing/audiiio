import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AppNavbar from './AppNavbar.js';
import { useAuth } from '../authentication/AuthContext.js';
import SignIn from '../authentication/SignIn.js';
import CalendarPage from '../calendar/CalendarPage.js';
import MagicWandIcon from '@mui/icons-material/AutoFixHigh';

function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [pressedButton, setPressedButton] = useState(null);

  if (!isAuthenticated) {
    return <SignIn />;
  }

  // Function to trigger animation manually
  const handlePress = (button) => {
    setPressedButton(button);
    setTimeout(() => setPressedButton(null), 200);
  };

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
      <AppNavbar />

      {/* Buttons Container */}
      <Box
        sx={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10,
          pointerEvents: 'auto',
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
            transform: pressedButton === 'remove' ? 'scale(0.4)' : 'scale(1)',
          }}
          disableRipple
          onMouseDown={() => handlePress('remove')}
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
            transform: pressedButton === 'add' ? 'scale(0.4)' : 'scale(1)',
          }}
          disableRipple
          onMouseDown={() => handlePress('add')}
          onClick={() => console.log('Add Event Clicked')}
        >
          Add Event
        </Button>

        {/* AI Magic Wand Button */}
        <IconButton 
          sx={{ 
            width: 50, 
            height: 50, 
            borderRadius: '12px',
            minWidth: 'auto',
            border: '2px solid transparent',
            background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, rgb(255, 0, 140), #FF69B4, rgb(247, 0, 255), rgb(245, 89, 245)) border-box',
            color: 'rgb(255, 0, 140)',
            transition: 'transform 0.2s ease-in-out',
            transform: pressedButton === 'ai' ? 'scale(0.4)' : 'scale(1)',
          }}
          disableRipple
          onMouseDown={() => handlePress('ai')}
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
          marginTop: '120px',
          maxHeight: '50vh',
          zIndex: 1,
        }}
      >
        <CalendarPage />
      </Box>
    </Box>
  );
}

export default Dashboard;
