import React, { useState } from 'react';
import AppNavbar from '../dashboard/AppNavbar';
import CalendarComponent from './CalendarComponent';

function CalendarPage() {
  
  return (
    <>
      <AppNavbar />

      <CalendarComponent/>
    </>
  );
}

export default CalendarPage;
