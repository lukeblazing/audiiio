import React, { useState, useCallback } from "react";
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
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import LoadingBorder from "../loading-components/LoadingBorder.js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Button from "@mui/material/Button";
import { ArrowBack, ArrowForward } from "@mui/icons-material";

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
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          borderRadius: "8px",
          transition: "background-color 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.1)",
            cursor: "pointer",
          },
        }}
      >
        <ArrowBack sx={{ color: theme.palette.primary.main, fontSize: "1.8rem" }} />
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center" flexGrow={2}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            textAlign: "center",
            fontSize: "1.5rem",
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            userSelect: "none",
            fontWeight: 800,
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
            marginTop: "8px",
          }}
        >
          Today
        </Button>
      </Box>
      <Box
        onClick={goToNext}
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          borderRadius: "8px",
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

// Helper functions for event time formatting
const isAllDayEvent = (event, currentDay) => {
  const eventStart = startOfDay(event.start);
  const eventEnd = startOfDay(event.end);
  const viewingDay = startOfDay(currentDay);
  const startsBeforeViewingDay = isBefore(eventStart, viewingDay);
  const endsOnOrAfterViewingDay =
    isAfter(eventEnd, viewingDay) || isSameDay(eventEnd, viewingDay);
  return startsBeforeViewingDay && endsOnOrAfterViewingDay;
};

const formatFullEventTime = (event, date) => {
  if (isAllDayEvent(event, date)) {
    return "All-day";
  }

  const startTime = format(event.start, "h:mm a").toLowerCase();
  const formattedStart = startTime.includes(":00")
    ? format(event.start, "h a").toLowerCase()
    : startTime;

  // If no end or it's 11:59 PM, only show start
  if (
    !event.end ||
    (event.end.getHours?.() === 23 && event.end.getMinutes?.() === 59)
  ) {
    return formattedStart;
  }

  const isSameDay = format(event.end, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");

  if (!isSameDay) {
    return formattedStart;
  }

  const endTime = format(event.end, "h:mm a").toLowerCase();
  const formattedEnd = endTime.includes(":00")
    ? format(event.end, "h a").toLowerCase()
    : endTime;

  return `${formattedStart} - ${formattedEnd}`;
};

// The CalendarComponent now receives events via props
const CalendarComponent = ({ events, isLoading, selectedCalendars }) => {
  const theme = useTheme();

  // Optionally filter events based on selected calendar filters
  const filteredEvents =
    selectedCalendars && selectedCalendars.length > 0
      ? events.filter((event) => selectedCalendars.includes(event.calendar_id))
      : events;

  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);

  const handleSelectSlot = useCallback(
    (slotInfo) => {
      const dayStart = startOfDay(slotInfo.start);
      const dayEnd = endOfDay(slotInfo.start);
      const eventsOnDay = filteredEvents.filter(
        (event) =>
          isWithinInterval(event.start, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(event.end, { start: dayStart, end: dayEnd }) ||
          (event.start < dayStart && event.end > dayEnd)
      );
      setSelectedEvents(eventsOnDay);
      setSelectedDate(slotInfo.start);
      setModalOpen(true);
    },
    [filteredEvents]
  );

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
    const borderColor = event.category_id || "dodgerblue";

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

      {isLoading ? (
        <LoadingBorder />
      ) : (
        <Box sx={{ flexGrow: 1, height: "100%", overflow: "hidden" }}>
          <BigCalendar
            localizer={localizer}
            events={filteredEvents}
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
                dateHeader: ({ label, date }) => (
                  <div
                    style={{
                      minHeight: "100%",
                      display: "flex",
                      flexDirection: "column",
                      paddingLeft: "4px"
                    }}
                  >
                    <span>{label}</span>
                    {filteredEvents
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
                ),
                event: () => null, // Suppress default event rendering in month view
              },


            }}
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventPropGetter}
            style={{ height: "100%" }}
          />
        </Box>
      )
      }

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.5)" } }}
      >
        <Box
          sx={{
            backdropFilter: 'blur(20px)',
            borderRadius: "16px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
            padding: "16px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            width: "100%",
            margin: "auto",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: "600", textAlign: "center", width: "100%" }}
          >
            Events on {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
          </Typography>
          <Box
            sx={{
              mt: 2,
              width: "100%",
              maxHeight: "60vh",
              overflowY: "auto",
              padding: "0 8px",
            }}
          >
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event, index) => (
                <Typography
                  key={index}
                  sx={{
                    background: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "8px",
                    fontSize: "1rem",
                    textAlign: "left",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <strong>{formatFullEventTime(event, selectedDate)}</strong>{" "}
                  {event.title}
                  {event.description && (
                    <>
                      <br />• {event.description}
                    </>
                  )}
                </Typography>
              ))
            ) : (
              <Typography
                sx={{ opacity: 0.8, fontSize: "1rem", textAlign: "center" }}
              >
                We're free!
              </Typography>
            )}
          </Box>
          <Button
            onClick={() => setModalOpen(false)}
            variant="contained"
            sx={{
              mt: 2,
              width: "100%",
              maxWidth: "200px",
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </Box >
  );
};

export default CalendarComponent;
