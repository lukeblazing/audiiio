import React, { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './components/shared-theme/AppTheme.js';
import Dashboard from './components/dashboard/Dashboard.js';
import { AuthProvider, useAuth } from './components/authentication/AuthContext.js';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <AuthProvider>
      <AppTheme>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {!isAuthenticated ? <SignIn /> : <Dashboard />}
        </Box>
      </AppTheme>
    </AuthProvider>
  );
}

export default App;
