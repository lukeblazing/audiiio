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
  differenceInMinutes,
  isBefore,
  isSameDay,
  isAfter
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import LoadingBorder from "../loading-components/LoadingBorder.js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

const CalendarToolbar = ({ date, view, onNavigate, onView, localizer }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const goToBack = () => onNavigate('PREV');
  const goToNext = () => onNavigate('NEXT');
  const goToToday = () => onNavigate('TODAY');

  const label = () => localizer.format(date, 'MMMM yyyy');

  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      padding={1}
      bgcolor="white"
      border="2px solid"
      borderColor={theme.palette.divider}
      borderRadius="8px 8px 0 0"
      borderBottom="none"
      flexWrap="nowrap"
    >
      {/* Left: Back Button with Full Hitzone */}
      <Box
        onClick={goToBack}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          borderRadius: '8px',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            cursor: 'pointer',
          },
        }}
      >
        <ArrowBack sx={{ color: theme.palette.primary.main, fontSize: '1.8rem' }} />
      </Box>

      {/* Center: Header and Today Button */}
      <Box display="flex" flexDirection="column" alignItems="center" flexGrow={2}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            textAlign: 'center',
            fontSize: '1.5rem',
            fontFamily: 'cursive',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        >
          {label()}
        </Typography>
        <Button
          onClick={goToToday}
          variant="text"
          size="small"
          sx={{
            padding: '6px 12px',
            textTransform: 'none',
            backgroundColor: 'transparent',
            color: theme.palette.primary.main,
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.05)',
            },
            marginTop: '8px',
          }}
        >
          Today
        </Button>
      </Box>

      {/* Right: Next Button with Full Hitzone */}
      <Box
        onClick={goToNext}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          borderRadius: '8px',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            cursor: 'pointer',
          },
        }}
      >
        <ArrowForward sx={{ color: theme.palette.primary.main, fontSize: '1.8rem' }} />
      </Box>
    </Box>
  );
};

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

const isAllDayEvent = (event, currentDay) => {
  // Ensure the event spans at least one full day
  const eventStart = startOfDay(event.start);
  const eventEnd = startOfDay(event.end);
  const viewingDay = startOfDay(currentDay);

  const startsBeforeViewingDay = isBefore(eventStart, viewingDay);
  const endsOnOrAfterViewingDay = isAfter(eventEnd, viewingDay) || isSameDay(eventEnd, viewingDay);

  return startsBeforeViewingDay && endsOnOrAfterViewingDay;
};

const formatFullEventTime = (event, date) => {
  if (isAllDayEvent(event, date)) {
    return "All-day"; // More descriptive than "All Day"
  } else {
    const startTime = format(event.start, "h:mm a").toLowerCase();
    const endTime = format(event.end, "h:mm a").toLowerCase();

    // If event starts and ends on the hour, omit minutes for brevity
    const formattedStart = startTime.includes(":00") ? format(event.start, "h a").toLowerCase() : startTime;
    const formattedEnd = endTime.includes(":00") ? format(event.end, "h a").toLowerCase() : endTime;

    return `${formattedStart} - ${formattedEnd}`;
  }
};

const formatCompressedEventTime = (event, date) => {
  if (isAllDayEvent(event, date)) {
    return "All-day"; // More intuitive than "All Day"
  } else {
    const startHour = format(event.start, "h");
    const startPeriod = format(event.start, "a").toLowerCase();

    return `${startHour}${startPeriod}`
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
              <strong>{formatCompressedEventTime(event, date)}:</strong> {event.title}
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
        /* Default grayout on cell selection */
        .rbc-selected-cell {
          background: rgba(0, 128, 255, 0.88) !important;
          border-radius: 4px; /* Slightly rounded for a modern look */
          transition: background-color 0.2s ease-in-out;
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
            longPressThreshold={0}
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
        BackdropProps={{
          sx: { backgroundColor: "transparent" }, // Removes gray background
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #4A4E69, #6D6875, #B5838D, #E5989B)",
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
            padding: "24px",
            maxWidth: "500px",
            margin: "auto",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#F8F8F8", // Light text for contrast
            textAlign: "center",
          }}
        >
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: "600",
              letterSpacing: "0.5px",
              color: "#F2E9E4", // Softer white
            }}
          >
            Events on {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
          </Typography>
          <Box id="modal-modal-description" sx={{ mt: 2 }}>
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event, index) => (
                <Typography
                  key={index}
                  sx={{
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "8px",
                    color: "#F8F8F8",
                    fontSize: "0.95rem",
                  }}
                >
                  <strong>{formatFullEventTime(event, selectedDate)}:</strong> {event.title}
                  <br />• {event.description}
                </Typography>
              ))
            ) : (
              <Typography sx={{ opacity: 0.8, fontSize: "1rem" }}>We're free!</Typography>
            )}
          </Box>
        </Box>
      </Modal>

    </Box>
  );
};

export default CalendarPage;
