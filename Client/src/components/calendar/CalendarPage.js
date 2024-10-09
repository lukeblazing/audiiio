import React, { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import LoadingBorder from '../loading-components/LoadingBorder.js';
import moment from "moment";
import CalendarToolbar from "./CalendarToolbar.js";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

// Custom styles for light mode
const calendarLightModeStyles = {
  backgroundColor: "#fff",  // White background for light mode
  color: "#000",  // Black text for light mode
  borderColor: "#ddd",  // Light grey border
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleNavigate = (date, view) => {
    setCurrentDate(date);
    setCurrentView(view);
  };

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

        const fetchedEvents = data.map((event, index) => {
          if (!event) {
            console.warn(`Event at index ${index} is undefined.`);
            return null;
          }
          if (!event.title) {
            console.warn(`Event at index ${index} is missing 'title'.`);
            event.title = 'No Title';
          }
          if (!event.start || !event.end) {
            console.warn(`Event at index ${index} is missing 'start' or 'end'.`);
            return null;
          }
          return {
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          };
        }).filter(event => event !== null);

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
    <div style={calendarLightModeStyles}>
      {isLoading ? (
        <LoadingBorder />
      ) : (
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          views={["month"]}
          date={currentDate}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          components={{
            toolbar: CalendarToolbar,
          }}
          style={calendarLightModeStyles}
        />
      )}
    </div>
  );
};

export default CalendarPage;
