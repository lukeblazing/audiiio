// CalendarPage.js

import React, { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import LoadingBorder from '../loading-components/LoadingBorder.js';
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import './CalendarPage.css';
import CalendarToolbar from "./CalendarToolbar.js";

const localizer = momentLocalizer(moment);

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
    <div className="calendar-container">
      {isLoading && <LoadingBorder />}
      {!isLoading && (
        <div className="calendar-wrapper">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ width: '100%', height: '100%' }} // Ensure the calendar fills the wrapper
            view={currentView}
            views={["month"]}
            date={currentDate}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            components={{
              toolbar: CalendarToolbar,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
