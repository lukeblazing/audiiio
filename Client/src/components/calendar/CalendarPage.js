import React, { useState } from 'react';
import {
  Box,
} from '@mui/material';
import AppNavbar from '../dashboard/AppNavbar';
import CalendarComponent from './CalendarComponent';
import SignIn from '../authentication/SignIn';
import { useAuth } from '../authentication/AuthContext';

function CalendarPage() {
  const { isAuthenticated } = useAuth();

  // Event fetching state: events and loading flag
  const [calendarEvents, setCalendarEvents] = useState([]);

  return (
    <>
      {!isAuthenticated ? (
        <SignIn />
      ) : (

        <>
          <AppNavbar />

          <CalendarComponent
            calendarEvents={calendarEvents}
            setCalendarEvents={setCalendarEvents}
          />
        </>
      )}
    </>
  );
}

export default CalendarPage;
