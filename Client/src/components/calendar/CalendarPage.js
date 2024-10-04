// CalendarPage.js
import React, { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import LoadingBorder from '../loading-components/LoadingBorder.js';

import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Initialize the localizer with moment
const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  // State to hold events fetched from the server
  const [events, setEvents] = useState([]);

  // State to manage loading and error states
  const [isLoading, setIsLoading] = useState(true);

  // State to manage the current view and date
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Handler for view change
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Handler for date navigation
  const handleNavigate = (date, view) => {
    setCurrentDate(date);
    setCurrentView(view);
  };

  // Collect events from db
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/events`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Validate and transform events
        const fetchedEvents = data.map((event, index) => {
          if (!event) {
            console.warn(`Event at index ${index} is undefined.`);
            return null;
          }
          if (!event.title) {
            console.warn(`Event at index ${index} is missing 'title'.`);
            event.title = 'No Title'; // Assign a default title or handle appropriately
          }
          if (!event.start || !event.end) {
            console.warn(`Event at index ${index} is missing 'start' or 'end'.`);
            return null; // Skip events without proper dates
          }
          return {
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          };
        }).filter(event => event !== null); // Remove any null entries

        setEvents(fetchedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="calendar-container" style={{ flex: 1, height: '100vh', padding: '10px' }}>
      {isLoading && <LoadingBorder />}
      {!isLoading && (
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={currentView}
          views={["day", "week", "month" ]}
          date={currentDate}
          onView={handleViewChange}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default CalendarPage;
