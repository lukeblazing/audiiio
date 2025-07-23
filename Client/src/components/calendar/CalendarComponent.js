import React, { useState, useCallback, useEffect } from "react";
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
  isBefore,
  isSameDay,
  isAfter,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LoadingSpinner from "../loading-components/LoadingSpinner.js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Button from "@mui/material/Button";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useAuth } from '../authentication/AuthContext';
import DayEventsModal from "./DayEventsModal.js";
import { formatFullEventTime } from "./DayEventsModal.js";

// Set up the localizer
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// Calendar Toolbar component for navigation
const CalendarToolbar = ({ date, onNavigate, localizer }) => {
  const theme = useTheme();

  const goToBack = () => onNavigate("PREV");
  const goToNext = () => onNavigate("NEXT");
  const goToToday = () => onNavigate("TODAY");

  const label = () => localizer.format(date, "MMMM yyyy");

  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      padding={1}
      bgcolor="transparent"
      flexWrap="nowrap"
      borderBottom={`1px solid ${theme.palette.divider}`}
    >
      <Box
        onClick={goToBack}
        sx={{
          flex: "0 0 25%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          borderRadius: "8px",
          position: "relative",
          zIndex: 2,
          transition: "background-color 0.2s ease",
        }}
      >
        <ChevronLeft sx={{ color: theme.palette.text.secondary, fontSize: "1.8rem" }} />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flex="0 0 50%"
        sx={{ minWidth: 0 }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            textAlign: "center",
            fontSize: "1.225rem",
            whiteSpace: "nowrap",
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            userSelect: "none",
            fontWeight: 800,
            position: "relative",
            zIndex: 1,
          }}
        >
          {label()}
        </Typography>
        <Button
          onClick={goToToday}
          variant="text"
          size="small"
          disableRipple
          sx={{
            padding: "6px 12px",
            textTransform: "none",
            backgroundColor: "transparent",
            border: "transparent",
            color: theme.palette.text.secondary,
            transition: "background-color 0.2s ease",
            marginTop: "8px"
          }}
        >
          Today
        </Button>
      </Box>
      <Box
        onClick={goToNext}
        sx={{
          flex: "0 0 25%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          borderRadius: "8px",
          position: "relative",
          zIndex: 2,
          transition: "background-color 0.2s ease",
        }}
      >
        <ChevronRight sx={{ color: theme.palette.text.secondary, fontSize: "1.8rem" }} />
      </Box>
    </Box>
  );
};

const DateHeader = ({ label, date, calendarEvents, getEventStyle }) => {
  const sortedEvents = (calendarEvents || [])
    .filter(
      (event) =>
        isWithinInterval(event.start, {
          start: startOfDay(date),
          end: endOfDay(date),
        }) ||
        isWithinInterval(event.end, {
          start: startOfDay(date),
          end: endOfDay(date),
        }) ||
        (event.start < startOfDay(date) && event.end > endOfDay(date))
    )
    .sort((a, b) => a.start - b.start); // Sort by start time

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        paddingLeft: "4px"
      }}
    >
      <span>{label}</span>
      {sortedEvents.map((event, index) => {
        const eventStartDate = format(event.start, "yyyy-MM-dd");
        const eventEndDate = format(event.end, "yyyy-MM-dd");
        const currentDate = format(date, "yyyy-MM-dd");

        const startsToday = eventStartDate === currentDate;
        const endsToday = eventEndDate === currentDate;

        const isPastDay = isBefore(startOfDay(date), startOfDay(new Date()));

        return (
          <div
            key={index}
            style={getEventStyle(startsToday, endsToday, isPastDay, event)}
          >
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <strong>{(event.title && (event.title != "Busy")) ? event.title : formatFullEventTime(event, date)}</strong>
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Utility to check if the color is valid
function isValidCssColor(color) {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
}

// Function to convert color names to RGB
function getRgbValues(color) {
  const tempEl = document.createElement("div");
  tempEl.style.color = color;
  document.body.appendChild(tempEl);

  const computedColor = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);

  // Extract RGB values from computed color string
  const rgbMatch = computedColor.match(/\d+/g);
  return rgbMatch ? rgbMatch.slice(0, 3).join(",") : "0,0,0";
}

export function eventBackground(borderColor, opacity = 0.15) {
  if (!isValidCssColor(borderColor)) borderColor = "dodgerblue";

  const rgb = getRgbValues(borderColor);
  const isBlack = rgb.replace(/\s/g, '') === "0,0,0";

  if (isBlack) return `rgba(${rgb}, 0.2)`;

  return `rgba(${rgb}, ${opacity})`;
}

// The CalendarComponent now receives events via props
const CalendarComponent = ({ }) => {
  const theme = useTheme();

  const { isAuthenticated } = useAuth();

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayEventsModalOpen, setDayEventsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  const handleSelectSlot = useCallback(
    (slotInfo) => {
      setSelectedDate(slotInfo.start);
      setDayEventsModalOpen(true);
    },
    [calendarEvents]
  );

  // Function to fetch all events for the user
  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/getAllEventsForUser`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      // Convert event dates to Date objects
      const fetchedEvents = (data.events || []).map((event) => ({
        ...event,
        start: new Date(event.start),
        end: event.end_time
          ? new Date(event.end_time)
          : new Date(new Date(event.start).setHours(23, 59, 0, 0)), // eventually this should be fixed to properly handle null end_times
      }));
      setCalendarEvents(fetchedEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEventsLoading(false);
    }
  };

  // Fetch calendar events on open
  useEffect(() => {
    fetchCalendarEvents();
  }, [isAuthenticated]);

  const getEventStyle = (startsToday, endsToday, isPastDay, event) => {
    const borderColor = isValidCssColor(event.category_id) ? event.category_id : "dodgerblue";

    const baseStyle = {
      fontSize: "0.5rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textAlign: "left",
      paddingTop: "2px",
      paddingBottom: "2px",
      paddingLeft: "4px",
      paddingRight: "0px",
      marginBottom: "2px",
      display: "flex",
      alignItems: "center",
      background: eventBackground(event.category_id, 0.2),
      filter: isPastDay ? "blur(1px) brightness(0.85)" : "none",
    };

    if (startsToday && !endsToday) {
      return {
        ...baseStyle,
        borderTop: `2px solid ${borderColor}`,
        borderBottom: `2px solid ${borderColor}`,
        borderLeft: `2px solid ${borderColor}`,
        borderRadius: "5px 0 0 5px",
      };
    } else if (!startsToday && endsToday) {
      return {
        ...baseStyle,
        borderTop: `2px solid ${borderColor}`,
        borderBottom: `2px solid ${borderColor}`,
        borderRight: `2px solid ${borderColor}`,
        borderRadius: "0 5px 5px 0",
      };
    } else if (!startsToday && !endsToday) {
      return {
        ...baseStyle,
        borderTop: `2px solid ${borderColor}`,
        borderBottom: `2px solid ${borderColor}`,
        borderRadius: "0",
      };
    }

    // Default: starts and ends today (single-day event)
    return {
      ...baseStyle,
      border: `2px solid ${borderColor}`,
      borderRadius: "5px",
    };
  };

  // Optional custom style getters for days and events
  const dayPropGetter = useCallback((date) => {
    const today = new Date();
    const isToday = isSameDay(date, today);
    const isPast = isBefore(date, startOfDay(today));

    return {
      className: [
        isPast && !isToday ? "past-date" : "",
        isToday ? "calendar-today" : ""
      ].join(" "),
      style: {
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        position: "relative",
        overflow: "hidden",
        boxShadow: "none",
        borderRadius: "0px",
      },
    };
  }, []);

  const eventPropGetter = useCallback(
    () => ({
      style: {
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
      },
    }),
    []
  );

  return (
    <>
      <style>{`
        /* Remove any existing backgrounds */

        .rbc-off-range-bg {
          background-color: transparent;
        }

        .rbc-month-row {
          border-top: 1px solid ${theme.palette.divider} !important;
        }
        
        .rbc-day-bg {
          border-left: 1px solid ${theme.palette.divider} !important;
        }

        .rbc-month-row .rbc-day-bg:first-child {
          border-left: none !important;
        }

        .calendar-today {
          z-index: 1;
          position: relative;
          background: transparent;
        }
        .calendar-today::after {
          content: "";
          pointer-events: none;
          border: 2px solid ${theme.palette.primary.main};
          border-radius: 6px;
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 2;
        }

        .rbc-selected-cell {
          background: rgba(16, 85, 153, 0.45);
          pointer-events: none;
          z-index: 1;
        }

        /* Month view wrapper */
        .rbc-month-view {
          border: none;
        }
        .past-date {
            position: relative;
            overflow: hidden;
        }

        .past-date::before,
        .past-date::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40%;
            height: 0.75px;
            background: rgba(255, 250, 245, 0.4); /* Very soft white with slight opacity */
            pointer-events: none;
            z-index: 0;
        }

        .past-date::before {
            transform: translate(-50%, -50%) rotate(45deg);
            box-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.1);
        }

        .past-date::after {
            transform: translate(-50%, -50%) rotate(-45deg);
            box-shadow: -0.5px -0.5px 1px rgba(0, 0, 0, 0.1);
        }

        /* Header cell (day names) */
        .rbc-header {
          font-size: 1rem;
          font-weight: bold;
          border-right: 1px solid ${theme.palette.divider} !important;
          border-top: none !important;
          border-bottom: none !important;
          border-left: none !important;
        }

        /* Remove left border from the first header (Monday/Sunday, depending on your week start) */
        .rbc-header:first-child {
          border-left: none !important;
        }

        /* Hide 'show more' link */
        .rbc-show-more {
          display: none;
        }

        /* Responsive font sizes */
        @media (max-width: 1024px) {
          .rbc-header, .rbc-date-cell {
            font-size: 1.3rem;
          }
        }
        @media (max-width: 768px) {
          .rbc-header, .rbc-date-cell {
            font-size: 1.1rem;
          }
        }
        @media (max-width: 480px) {
          .rbc-header, .rbc-date-cell {
            font-size: 1.0rem;
          }
        }
        @media (max-width: 360px) {
          .rbc-header, .rbc-date-cell {
            font-size: 0.9rem;
          }
        }
  `}</style>

      {isEventsLoading ? (
        <LoadingSpinner />
      ) : (
        <Box
          sx={{
            position: 'fixed',
            top: 'calc(150px + env(safe-area-inset-top))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90vw',
            maxWidth: '1000px',
            height: 'min(max(60vh, 50vw), 120vw)',
            maxHeight: '750px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: `2px solid ${theme.palette.divider}`,
            boxShadow: 3
          }}
        >
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            selectable
            longPressThreshold={0}
            onSelectSlot={handleSelectSlot}
            view={currentView}
            views={[Views.MONTH, Views.DAY]}
            date={currentDate}
            onView={(view) => setCurrentView(view)}
            onNavigate={(date) => setCurrentDate(date)}
            drilldownView={null}
            components={{
              toolbar: CalendarToolbar,
              month: {
                dateHeader: (props) => (
                  <DateHeader
                    {...props}
                    calendarEvents={calendarEvents}
                    getEventStyle={getEventStyle}
                  />
                ),
                event: () => null, // Suppress default event rendering in month view
              },


            }}
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventPropGetter}
            style={{ width: "100%", height: "100%" }}
          />

          <DayEventsModal
            open={dayEventsModalOpen}
            onClose={() => setDayEventsModalOpen(false)}
            selectedDate={selectedDate}
            calendarEvents={calendarEvents}
            fetchCalendarEvents={fetchCalendarEvents}
          />
        </Box>
      )}
    </>
  );
};

export default CalendarComponent;
