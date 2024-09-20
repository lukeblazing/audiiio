import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './components/shared-theme/AppTheme.js';
import Dashboard from './components/dashboard/Dashboard.js';
import { AuthProvider } from './components/authentication/AuthContext.js';
import SignUp from './components/authentication/SignUp.js';
import SignIn from './components/authentication/SignIn.js';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppTheme>
          <CssBaseline />
          <Routes>
            <Route path="/" element={<Dashboard />} /> 
            <Route path="/sign-up" element={<SignUp />} /> 
            <Route path="/sign-in" element={<SignIn />} /> 
          </Routes>
        </AppTheme>
      </AuthProvider>
    </Router>
  );
}

export default App;
