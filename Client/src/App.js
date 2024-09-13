import React from 'react';
import AppNavbar from './components/AppNavbar.js';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

function App() {
  return (
    <>
      {/* CSS Reset and Base Styles */}
      <CssBaseline />

      {/* Container Box to structure the layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* AppNavbar Component */}
        <AppNavbar />

        {/* Empty main content area to occupy space below the NavBar */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: 'background.default', // Uses MUI's default background
            overflow: 'auto',
          }}
        >
          {/* Empty content */}
        </Box>
      </Box>
    </>
  );
}

export default App;

