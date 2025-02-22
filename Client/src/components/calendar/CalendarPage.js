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
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import LoadingBorder from "../loading-components/LoadingBorder.js";
import CalendarToolbar from "./CalendarToolbar.js";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const calendarAppleStyle = {
  color: "#000",
  transition: "background-color 0.2s ease",
  fontFamily: "cursive",
  backgroundColor: "inherit",
};

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

// Function to format event times for the modal
const formatEventTime = (event) => {
  if (event.allDay) {
    return "All Day";
  } else {
    const startTime = format(event.start, "h:mm a");
    const endTime = format(event.end, "h:mm a");
    return `${startTime} - ${endTime}`;
  }
};

const formatCompressedEventTime = (event) => {
  if (event.allDay) {
    return "All Day";
  } else {
    const startTime = format(event.start, "h");
    const endTime = format(event.end, "h");
    const startPeriod = format(event.start, "a").toLowerCase();
    const endPeriod = format(event.end, "a").toLowerCase();

    // If both times are in the same period (AM/PM), only show the period once
    return startPeriod === endPeriod
      ? `${startTime}-${endTime}${endPeriod}`
      : `${startTime}${startPeriod}-${endTime}${endPeriod}`;
  }
};

// NoEvent component to suppress default event rendering in month view
const NoEvent = () => null;

const CalendarPage = () => {
  const theme = useTheme();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  const handleNavigate = useCallback((date) => {
    setCurrentDate(date);
  }, []);

  const handleSelectSlot = useCallback(
    (slotInfo) => {
      const dayStart = startOfDay(slotInfo.start);
      const dayEnd = endOfDay(slotInfo.start);
      const eventsOnDay = events.filter(
        (event) =>
          isWithinInterval(event.start, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(event.end, { start: dayStart, end: dayEnd }) ||
          (event.start < dayStart && event.end > dayEnd)
      );
      setSelectedEvents(eventsOnDay);
      setSelectedDate(slotInfo.start);
      setModalOpen(true);
    },
    [events]
  );

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
            if (!event || !event.start || !event.end || !event.title) {
              console.warn(`Skipping invalid event at index ${index}`);
              return null;
            }
            return {
              ...event,
              title: event.title,
              start: new Date(event.start),
              end: new Date(event.end),
              description: event.description || "no description provided."
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

  // Updated CustomDateHeader to show day number and list of event titles
  const CustomDateHeader = useCallback(
    ({ label, date }) => {
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const eventsOnDay = events.filter(
        (event) =>
          isWithinInterval(event.start, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(event.end, { start: dayStart, end: dayEnd }) ||
          (event.start < dayStart && event.end > dayEnd)
      );

      return (
        <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
          <span
            style={{
              textDecoration: isToday ? "underline" : "none",
              marginBottom: "4px",
            }}
          >
            {label}
          </span>
          {eventsOnDay.map((event, index) => (
            <div
              key={index}
              className="custom-event"
              style={{
                fontSize: "0.5rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: "normal",
                textAlign: "left", // Ensure left alignment
                fontFamily: "Arial, sans-serif", // More readable font
                paddingLeft: "4px", // Slight padding for spacing
              }}
            >
              <strong>{formatCompressedEventTime(event)}:</strong> {event.title}
            </div>
          ))}
        </div>
      );
    },
    [events]
  );

  // Updated dayPropGetter to use a single class for all days
  const dayPropGetter = useCallback(
    (date) => ({
      style: {
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        position: "relative",
        overflow: "hidden",
      },
      className: "calendar-day",
    }),
    []
  );

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
          position: "relative";
        }
        .rbc-month-row:last-child .rbc-day-bg {
          border-bottom: none !important;
        }
        .rbc-day-bg:last-child {
          border-right: none !important;
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
            height: "100%",
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
            drilldownView={null} // Prevent navigation on day click
            components={{
              toolbar: CalendarToolbar,
              month: {
                dateHeader: CustomDateHeader,
                event: NoEvent, // Suppress default event rendering in month view
              },
            }}
            style={{ ...calendarAppleStyle, height: "100%" }}
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventPropGetter}
          />
        </Box>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Events on{" "}
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
          </Typography>
          <Box id="modal-modal-description" sx={{ mt: 2 }}>
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event, index) => (
                <Typography key={index}>
                  <strong>{formatEventTime(event)}:</strong> {event.title}
                  <br />• {event.description}
                </Typography>
              ))
            ) : (
              <Typography>We're free!</Typography>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default CalendarPage;
