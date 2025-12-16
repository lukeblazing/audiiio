import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './components/authentication/AuthContext.js';
import AccessCodeGate from './components/authentication/AccessCodeGate.js';
import SignUp from './components/authentication/SignUp.js';
import SignIn from './components/authentication/SignIn.js';
import { ThemeProvider } from '@emotion/react';
import theme from './Theme/theme';
import AudioPlayer from './components/calendar/AudioPlayer.js';


function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AccessCodeGate>
            <CssBaseline />

            <Routes>
              {/* All routes that need the navbar live under DashboardLayout */}
              <Route index element={<AudioPlayer />} /> 

              {/* Routes without the navbar */}
              <Route path="sign-up" element={<SignUp />} />
              <Route path="sign-in" element={<SignIn />} />
            </Routes>
          </AccessCodeGate>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
