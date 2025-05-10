import React, { useState } from 'react';
import AppNavbar from '../dashboard/AppNavbar';
import CalendarComponent from './CalendarComponent';

function CalendarPage() {
  
  return (
    <div id="safe-area-wrapper">
      <AppNavbar />

      <CalendarComponent/>
    </div>
  );
}

export default CalendarPage;
