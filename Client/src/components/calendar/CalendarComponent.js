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
import { ArrowBack, ArrowForward, } from "@mui/icons-material";
import { useAuth } from '../authentication/AuthContext';
import DayEventsModal from "./DayEventsModal.js";

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
      border="4px solid"
      borderColor={theme.palette.divider}
      borderRadius="8px 8px 0 0"
      borderBottom="none"
      flexWrap="nowrap"
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
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.1)",
            cursor: "pointer",
          },
        }}
      >
        <ArrowBack sx={{ color: theme.palette.primary.main, fontSize: "1.8rem" }} />
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
            color: theme.palette.primary.main,
            transition: "background-color 0.2s ease",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" },
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
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.1)",
            cursor: "pointer",
          },
        }}
      >
        <ArrowForward sx={{ color: theme.palette.primary.main, fontSize: "1.8rem" }} />
      </Box>
    </Box>
  );
};

const DateHeader = ({ label, date, calendarEvents, getEventStyle }) => {
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
      {(calendarEvents || [])
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
        .map((event, index) => {
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
                <strong>{event.title}</strong>
              </span>
            </div>
          );
        })}
    </div>
  );
};


// The CalendarComponent now receives events via props
const CalendarComponent = ({ calendarEvents, setCalendarEvents }) => {
  const theme = useTheme();

  const { isAuthenticated } = useAuth();

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
    setIsEventsLoading(true);
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
          : new Date(new Date(event.start).setHours(23, 59, 0, 0)),
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
    if (isAuthenticated) {
      fetchCalendarEvents();
    }
  }, [isAuthenticated]);

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

  const getEventStyle = (startsToday, endsToday, isPastDay, event) => {
    const borderColor = isValidCssColor(event.category_id) ? event.category_id : "dodgerblue";

    // Gradient background using RGBA
    const semiTransparentBackground = isValidCssColor(borderColor)
      ? `linear-gradient(to right, rgba(${getRgbValues(borderColor)}, 0.1), rgba(${getRgbValues(borderColor)}, 0.05))`
      : "transparent";

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
      background: semiTransparentBackground,
      filter: isPastDay ? "blur(1px) brightness(0.85)" : "none",
    };

    if (startsToday && !endsToday) {
      return {
        ...baseStyle,
        borderTop: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderLeft: `1px solid ${borderColor}`,
        borderRadius: "5px 0 0 5px",
      };
    } else if (!startsToday && endsToday) {
      return {
        ...baseStyle,
        borderTop: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderRadius: "0 5px 5px 0",
      };
    } else if (!startsToday && !endsToday) {
      return {
        ...baseStyle,
        borderTop: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderRadius: "0",
      };
    }

    // Default: starts and ends today (single-day event)
    return {
      ...baseStyle,
      border: `1px solid ${borderColor}`,
      borderRadius: "5px",
    };
  };

  // Optional custom style getters for days and events
  const dayPropGetter = useCallback((date) => {
    const today = new Date();
    const isToday = isSameDay(date, today);
    const isPast = isBefore(date, startOfDay(today));

    return {
      className: isPast && !isToday ? "past-date" : "",
      style: {
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        position: "relative",
        overflow: "hidden",
        border: isToday
          ? `1px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.divider}`,
        boxShadow: isToday
          ? `inset 0 0 2px lightgray`
          : "none",
        backgroundColor: "transparent",
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

        .rbc-row {
          border: none !important;
        }

        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid ${theme.palette.divider} !important;
        }


        /* Selected cell styling */
        .rbc-selected-cell {
          background: rgba(16, 85, 153, 0.88) !important;
          border-radius: 4px;
          transition: background-color 0.2s ease-in-out;
        }

        /* Month view wrapper */
        .rbc-month-view {
          border-radius: 0 0 8px 8px;
          border: 4px solid ${theme.palette.divider};
        }
        .past-date {
            position: relative;
            background: rgba(250, 245, 240, 0.8); /* Soft white with a warm undertone */
            border-radius: 4px;
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

        .rbc-month-view .rbc-day-bg:last-child {
          border-right: none !important;
        }

        /* Header cell (day names) */
        .rbc-header {
          font-size: 1rem;
          font-weight: bold;
          border: 1px solid ${theme.palette.divider} !important;
        }

        /* Hide 'show more' link */
        .rbc-show-more {
          display: none;
        }

        /* Date cell text styling */
        .rbc-date-cell {
          font-size: 1rem;
          font-weight: normal;
          transition: font-size 0.2s ease;
        }

        /* Responsive font sizes */
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

      {isEventsLoading ? (
        <LoadingSpinner />
      ) : (
        <Box
          sx={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            pt: { xs: '102px', sm: '102px', md: '102px' }, // Push content below the navbar
            overflowY: 'Visible',
          }}
        >
          <Box
            sx={{
              aspectRatio: '7 / 9',
              width: 'min(90vw, 800px)',
              bgcolor: 'background.paper',
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
              style={{ height: "100%" }}
            />

            <DayEventsModal
              open={dayEventsModalOpen}
              onClose={() => setDayEventsModalOpen(false)}
              selectedDate={selectedDate}
              calendarEvents={calendarEvents}
              fetchCalendarEvents={fetchCalendarEvents}
            />
          </Box>
        </Box>
      )}
    </>
  );
};

export default CalendarComponent;
