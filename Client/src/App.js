import React from 'react';
import { BrowserRouter as Router, Route, Routes, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import CalendarPage from './components/calendar/CalendarPage.js';
import { AuthProvider } from './components/authentication/AuthContext.js';
import SignUp from './components/authentication/SignUp.js';
import SignIn from './components/authentication/SignIn.js';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/sign-in" element={<SignIn />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
