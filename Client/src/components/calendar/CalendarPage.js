import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import {
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  format,
  getDay,
  startOfWeek,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import LoadingBorder from "../loading-components/LoadingBorder.js";
import CalendarToolbar from "./CalendarToolbar.js";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }), // Ensuring correct week start
  getDay,
  locales,
});

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
    ({ label, date }) => {
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      return (
        <span
          style={{
            fontWeight: isToday ? "bold" : "normal",
          }}
        >
          {label}
        </span>
      );
    },
    [theme]
  );

  const dayPropGetter = useCallback(
    (date) => {
      const hasEvents = events.some((event) =>
        isWithinInterval(date, {
          start: startOfDay(new Date(event.start)),
          end: endOfDay(new Date(event.end)),
        })
      );
      return {
        style: {
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          position: "relative",
          overflow: "hidden",
        },
        className: hasEvents ? "calendar-day-with-event" : "calendar-day",
      };
    },
    [events]
  );

  const eventPropGetter = useCallback(() => ({ style: { display: "none" } }), []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: "55vh",
        marginRight: "2vh",
        marginLeft: "2vh",
        overflow: "hidden",
      }}
    >
      <style>{`
        .rbc-today, .rbc-off-range-bg {
          background-color: transparent !important;
        }
        .rbc-month-view {
          border-radius: 0 0 8px 8px;
          border: 2px solid ${theme.palette.divider};
        }
        .rbc-day-bg {
          border-right: 1px solid ${theme.palette.divider} !important;
          border-bottom: 1px solid ${theme.palette.divider} !important;
          position: relative;
        }
        .rbc-month-row:last-child .rbc-day-bg {
          border-bottom: none !important;
        }
        .rbc-day-bg:last-child {
          border-right: none !important;
        }
        .calendar-day-with-event::after {
          content: '●';
          color: red;
          font-size: 20px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .rbc-header {
          font-size: 1rem;
          font-weight: bold;
        }
        .rbc-date-cell {
          font-size: 1rem;
          font-weight: normal;
          transition: font-size 0.2s ease;
        }
        @media (max-width: 1024px) {
          .rbc-header, .rbc-date-cell {
            font-size: 0.8rem;
          }
        }
        @media (max-width: 768px) {
          .rbc-header, .rbc-date-cell {
            font-size: 0.7rem;
          }
        }
        @media (max-width: 480px) {
          .rbc-header, .rbc-date-cell {
            font-size: 0.6rem;
          }
        }
        @media (max-width: 360px) {
          .rbc-header, .rbc-date-cell {
            font-size: 0.5rem;
          }
        }
      `}</style>

      {isLoading ? (
        <LoadingBorder />
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            height: "100%", // Ensures it takes full height of container
            overflow: "hidden",
          }}
        >
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            view={currentView}
            views={[Views.MONTH, Views.DAY]}
            date={currentDate}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            components={{
              toolbar: CalendarToolbar,
              month: { dateHeader: CustomDateHeader },
            }}
            style={{ ...calendarAppleStyle, height: "100%" }} // Forces height to fill container
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventPropGetter}
          />
        </Box>
      )}
    </Box>
  );
};

export default CalendarPage;
