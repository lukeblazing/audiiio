import React, { useState } from 'react';
import AppNavbar from './components/dashboard/AppNavbar.js';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import SignIn from './components/authentication/SignIn.js';
import AppTheme from './components/shared-theme/AppTheme.js';

function App(props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);  // Set auth state back to false
  };

  return (
    <AppTheme {...props}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* If not authenticated, show the SignIn component */}
        {!isAuthenticated ? (
          <SignIn onLogin={handleLogin} />
        ) : (
          <>
            <AppNavbar handleLogout={handleLogout} />
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
        )}
      </Box>
    </AppTheme>
  );
}

export default App;

