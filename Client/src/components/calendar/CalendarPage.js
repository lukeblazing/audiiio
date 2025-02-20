import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  Views,
} from "react-big-calendar";
import {
  useTheme,
} from '@mui/material';
import LoadingBorder from "../loading-components/LoadingBorder.js";
import moment from "moment";
import CalendarToolbar from "./CalendarToolbar.js";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const calendarAppleStyle = {
  color: "#000",
  transition: "background-color 0.2s ease",
  fontFamily: "cursive",
  backgroundColor: "inherit",
};

const CalendarPage = () => {
  const theme = useTheme();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  const handleNavigate = useCallback((date) => {
    setCurrentDate(date);
  }, []);

  const handleSelectSlot = useCallback((slotInfo) => {
    console.log("Clicked on date: ", slotInfo.start);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/calendar/events`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const fetchedEvents = data
          .map((event, index) => {
            if (!event || !event.start || !event.end) {
              console.warn(`Skipping invalid event at index ${index}`);
              return null;
            }
            return {
              ...event,
              title: event.title || "No Title",
              start: new Date(event.start),
              end: new Date(event.end),
            };
          })
          .filter(Boolean);

        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const CustomDateHeader = useCallback(
    ({ date }) => {
      const now = new Date();
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      const isToday = date.toDateString() === now.toDateString();

      const baseStyle = {
        position: "absolute",
        top: "4px",
        right: "4px",
        width: "28px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        lineHeight: "normal",
        textAlign: "center",
        pointerEvents: "none",
      };

      const style = isToday
        ? { ...baseStyle, border: "2px solid #aaa", borderRadius: "50%", fontWeight: "bold" }
        : { ...baseStyle, color: isCurrentMonth ? "#000" : "#aaa" };

      return (
        <div style={{ position: "relative", height: "100%" }}>
          <div style={style}>{date.getDate()}</div>
        </div>
      );
    },
    [currentDate]
  );

  const dayPropGetter = useCallback(
    (date) => {
      const hasEvents = events.some((event) => 
        moment(date).isBetween(moment(event.start).startOf("day"), moment(event.end).endOf("day"), null, "[]") // Inclusive range
      );
  
      return {
        style: {
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          position: "relative", // Ensures absolute positioning for the "X"
        },
        className: hasEvents ? "calendar-day-with-event" : "calendar-day",
      };
    },
    [events]
  );
  

  const eventPropGetter = useCallback(() => ({
    style: { display: "none" },
  }), []);  

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "transparent",
      }}
    >
    <style>{`
      .rbc-today, .rbc-off-range-bg {
        background-color: transparent !important;
      }
      .rbc-month-view {
        border-radius: 0 0 8px 8px; /* Adjust the value as needed */
        overflow: hidden; /* Ensures children respect the border radius */
        border: 2px solid ${theme.palette.divider};
      }
      /* Make the borders between days thicker and use the theme palette */
      .rbc-day-bg {
        border-right: 1px solid ${theme.palette.divider} !important;
        border-bottom: 1px solid ${theme.palette.divider} !important;
        border-radius: 0 !important;
      }
      /* Remove border from last column to avoid double thickness on right edge */
      .rbc-month-row:last-child .rbc-day-bg {
        border-bottom: none !important;
      }
      /* Remove border from last column to avoid double thickness on right edge */
      .rbc-day-bg:last-child {
        border-right: none !important;
      }
      .calendar-day-with-event::after {
        content: '✖'; /* Red X */
        color: red;
        font-size: 20px;
        font-weight: bold;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
    `}</style>
      {isLoading ? (
        <LoadingBorder />
      ) : (
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          view={currentView}
          views={["month"]}
          date={currentDate}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          components={{
            toolbar: CalendarToolbar,
            month: {
              dateHeader: CustomDateHeader,
            },
          }}
          style={calendarAppleStyle}
          dayPropGetter={dayPropGetter}
          eventPropGetter={eventPropGetter}
        />
      )}
    </div>
  );
};

export default CalendarPage;
