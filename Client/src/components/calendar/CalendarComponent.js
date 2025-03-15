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
      bgcolor="white"
      border="2px solid"
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
          }}
        >
          {label()}
        </Typography>
        <Button
          onClick={goToToday}
          variant="text"
          size="small"
          sx={{
            padding: "6px 12px",
            textTransform: "none",
            backgroundColor: "transparent",
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
  } else {
    const startTime = format(event.start, "h:mm a").toLowerCase();
    const endTime = format(event.end, "h:mm a").toLowerCase();
    const formattedStart = startTime.includes(":00")
      ? format(event.start, "h a").toLowerCase()
      : startTime;
    const formattedEnd = endTime.includes(":00")
      ? format(event.end, "h a").toLowerCase()
      : endTime;
    return `${formattedStart} - ${formattedEnd}`;
  }
};

const formatCompressedEventTime = (event, date) => {
  if (isAllDayEvent(event, date)) {
    return "All-day";
  } else {
    const startHour = format(event.start, "h");
    const startPeriod = format(event.start, "a").toLowerCase();
    return `${startHour}${startPeriod}`;
  }
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

  // Optional custom style getters for days and events
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
        .rbc-selected-cell {
          background: rgba(0, 128, 255, 0.88) !important;
          border-radius: 4px;
          transition: background-color 0.2s ease-in-out;
        }
        .rbc-month-view {
          border-radius: 0 0 8px 8px;
          border: 2px solid ${theme.palette.divider};
        }
        .rbc-day-bg {
          border-right: 1px solid ${theme.palette.divider} !important;
          border-bottom: 1px solid ${theme.palette.divider} !important;
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
                    }}
                  >
                    <span>{label}</span>
                    {filteredEvents
                      .filter((event) =>
                        isWithinInterval(event.start, {
                          start: startOfDay(date),
                          end: endOfDay(date),
                        }) ||
                        isWithinInterval(event.end, {
                          start: startOfDay(date),
                          end: endOfDay(date),
                        })
                      )
                      .map((event, index) => (
                        <div
                        key={index}
                        style={{
                          fontSize: "0.5rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textAlign: "left",
                          paddingLeft: "4px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: event.category_id || "dodgerblue",
                            marginRight: "4px",
                          }}
                        />
                        <strong>{event.title}</strong>
                      </div>
                      ))}
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
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.5)" } }}
      >
        <Box
          sx={{
            background: "white",
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
                  }}
                >
                  <strong>{formatFullEventTime(event, selectedDate)}</strong>{" "}
                  {event.title}
                  <br />• {event.description}
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
    </Box>
  );
};

export default CalendarComponent;
