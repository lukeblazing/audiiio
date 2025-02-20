import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  Views,
} from "react-big-calendar";
import LoadingBorder from "../loading-components/LoadingBorder.js";
import moment from "moment";
import CalendarToolbar from "./CalendarToolbar.js";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const calendarAppleStyle = {
  backgroundColor: "#fff",
  border: "1px solid #E0E0E0",
  borderRadius: "8px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  color: "#000",
  transition: "background-color 0.2s ease",
  fontFamily: "cursive",
};

const CalendarPage = () => {
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
    // Further actions on date click can be implemented here.
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
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

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

  const CustomDateHeader = useCallback(({ date }) => {
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
      pointerEvents: "none", // disable pointer events on the date number
    };
  
    const style = isToday
      ? {
          ...baseStyle,
          border: "2px solid #aaa",
          borderRadius: "50%",
          fontWeight: "bold",
        }
      : {
          ...baseStyle,
          color: isCurrentMonth ? "#000" : "#aaa",
        };
  
    return (
      <div style={{ position: "relative", height: "100%" }}>
        <div style={style}>{date.getDate()}</div>
      </div>
    );
  }, [currentDate]);
  
  
  
  

  const dayPropGetter = useCallback((date) => ({
    style: {
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
    },
    className: "calendar-day",
  }), []);

  return (
    <div style={{ padding: "16px", backgroundColor: "#fafafa" }}>
      <style>{`
        .rbc-today, .rbc-off-range-bg {
          background-color: transparent !important;
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
        />
      )}
    </div>
  );
};

export default CalendarPage;
