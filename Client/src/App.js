import React, { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './components/shared-theme/AppTheme.js';
import Dashboard from './components/dashboard/Dashboard.js';
import { AuthProvider } from './components/authentication/AuthContext.js';

function App() {
  return (
    <AuthProvider>
      <AppTheme>
        <CssBaseline />
        <Dashboard />
      </AppTheme>
    </AuthProvider>
  );
}

export default App;
