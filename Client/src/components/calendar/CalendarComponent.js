import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  addMonths,
  startOfMonth,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LoadingSpinner from "../loading-components/LoadingSpinner.js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Button from "@mui/material/Button";
import { useAuth } from '../authentication/AuthContext';
import DayEventsModal from "./DayEventsModal.js";
import { formatFullEventTime } from "./DayEventsModal.js";
import { FixedSizeList as List } from "react-window";

// Set up the localizer
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// DateHeader stays unchanged!
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
    .sort((a, b) => a.start - b.start);

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
              <strong>{(event.title && (event.title !== "Busy")) ? event.title : formatFullEventTime(event, date)}</strong>
            </span>
          </div>
        );
      })}
    </div>
  );
};

const MonthLabelToolbar = ({ date, localizer }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 1,
        background: theme.palette.background.paper,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={800}
        style={{
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        {localizer.format(date, "MMMM yyyy")}
      </Typography>
    </Box>
  );
};


// Utilities for event color, etc
function isValidCssColor(color) {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
}
function getRgbValues(color) {
  const tempEl = document.createElement("div");
  tempEl.style.color = color;
  document.body.appendChild(tempEl);
  const computedColor = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);
  const rgbMatch = computedColor.match(/\d+/g);
  return rgbMatch ? rgbMatch.slice(0, 3).join(",") : "0,0,0";
}
export function eventBackground(borderColor, opacity = 0.3) {
  if (!isValidCssColor(borderColor)) borderColor = "dodgerblue";
  const rgb = getRgbValues(borderColor);
  const isBlack = rgb.replace(/\s/g, '') === "0,0,0";
  if (isBlack) return `rgba(${rgb}, 0.2)`;
  return `rgba(${rgb}, ${opacity})`;
}

const MONTH_ROW_HEIGHT = 500; // px; Adjust for your design/layout

// One month grid as a row in the list
const MonthRow = React.memo(
  ({ style, monthDate, events, onSelectSlot, getEventStyle, dayPropGetter, eventPropGetter, dateCellWrapper }) => (
    <Box style={style}>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable={true}
        longPressThreshold={250}
        defaultView={Views.MONTH}
        views={[Views.MONTH]}
        defaultDate={monthDate}
        drilldownView={null}
        onSelectSlot={onSelectSlot}
        components={{
          dateCellWrapper: dateCellWrapper,
          toolbar: (toolbarProps) => (
            <MonthLabelToolbar {...toolbarProps} />
          ),
          month: {
            dateHeader: (props) => (
              <DateHeader
                {...props}
                calendarEvents={events}
                getEventStyle={getEventStyle}
              />
            ),
            event: () => null
          }
        }}
        dayPropGetter={dayPropGetter}
        eventPropGetter={eventPropGetter}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  )
);

const VirtualisedCalendar = ({
  calendarEvents,
  onSelectSlot,
  getEventStyle,
  dayPropGetter,
  eventPropGetter,
}) => {
  const totalMonths = 24;
  const currentMonthIndex = 3;
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const listRef = useRef(null);

  const DateCellWrapper = ({ value, children }) => {
    const handleClick = () => {
      const slotInfo = {
        start: value,
        end: value,
        action: "click",
        slots: [value]
      };
      onSelectSlot(slotInfo); // Use the prop passed down!
    };
    return (
      <div onClick={handleClick} style={{ height: '100%', cursor: 'pointer' }}>
        {children}
      </div>
    );
  };


  // react-window callback to update header
  const handleItemsRendered = useCallback(
    ({ visibleStartIndex }) => {
      const topMonth = addMonths(
        startOfMonth(new Date()),
        visibleStartIndex - currentMonthIndex
      );
      setVisibleMonth(topMonth);
    },
    [currentMonthIndex]
  );

  // Must memoize events to avoid excess rerenders
  const itemData = useMemo(
    () => ({
      events: calendarEvents,
      onSelectSlot,
      getEventStyle,
      dayPropGetter,
      eventPropGetter,
    }),
    [calendarEvents, onSelectSlot, getEventStyle, dayPropGetter, eventPropGetter]
  );

  return (
    <Box sx={{ height: "100%", width: "100%", overflow: "hidden" }}>
      <List
        ref={listRef}
        height={MONTH_ROW_HEIGHT * 1.75} // fits about 1.5 months at a time, tweak to your liking
        itemCount={totalMonths}
        itemSize={MONTH_ROW_HEIGHT}
        initialScrollOffset={currentMonthIndex * MONTH_ROW_HEIGHT}
        onItemsRendered={handleItemsRendered}
        itemData={itemData}
        overscanCount={2}
      >
        {({ index, style, data }) => {
          const monthDate = addMonths(
            startOfMonth(new Date()),
            index - currentMonthIndex
          );
          return (
            <MonthRow
              style={style}
              monthDate={monthDate}
              events={data.events}
              onSelectSlot={data.onSelectSlot}
              getEventStyle={data.getEventStyle}
              dayPropGetter={data.dayPropGetter}
              eventPropGetter={data.eventPropGetter}
              dateCellWrapper={DateCellWrapper}
            />
          );
        }}
      </List>
    </Box>
  );
};

const CalendarComponent = () => {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [dayEventsModalOpen, setDayEventsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  const handleSelectSlot = React.useCallback(
    (info) => {
      // react‑big‑calendar sets this to "click" for a real tap,
      // and to "select" (or "doubleClick") for a drag / long‑press.
      if (info.action !== "click") return;        // ← ignore scroll/drag
      setSelectedDate(info.start);
      setDayEventsModalOpen(true);
    },
    []
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
      background: eventBackground(event.category_id),
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
    return {
      ...baseStyle,
      border: `2px solid ${borderColor}`,
      borderRadius: "5px",
    };
  };

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
        .rbc-off-range,
        .rbc-off-range-bg {
          visibility: hidden !important;

          pointer-events: none !important;
        }
        .rbc-month-row { border-top: none !important; }
        .rbc-day-bg { border-left: none !important;}
        .rbc-month-row .rbc-day-bg:first-child { border-left: none !important; }
        .calendar-today { z-index: 1; position: relative; background: transparent; }
        .calendar-today::after {
          content: "";
          pointer-events: none;
          border: 2px solid ${theme.palette.primary.main};
          border-radius: 6px;
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2;
        }
        .rbc-selected-cell { background: rgba(16, 85, 153, 0.45); pointer-events: none; z-index: 1; }
        .rbc-month-view { border: none; }
        .past-date { position: relative; overflow: hidden; }
        .past-date::before, .past-date::after {
          content: "";
          position: absolute; top: 50%; left: 50%; width: 40%; height: 0.75px;
          background: rgba(255, 250, 245, 0.4); pointer-events: none; z-index: 0;
        }
        .past-date::before { transform: translate(-50%, -50%) rotate(45deg); box-shadow: 0.5px 0.5px 1px rgba(0,0,0,0.1);}
        .past-date::after { transform: translate(-50%, -50%) rotate(-45deg); box-shadow: -0.5px -0.5px 1px rgba(0,0,0,0.1);}
        .rbc-header { font-size: 1rem; font-weight: bold; border-right: none !important; border-top: none !important; border-bottom: none !important; border-left: none !important; }
        .rbc-header:first-child { border-left: none !important; }
        .rbc-show-more { display: none; }
        @media (max-width: 1024px) { .rbc-header, .rbc-date-cell { font-size: 1.3rem; } }
        @media (max-width: 768px) { .rbc-header, .rbc-date-cell { font-size: 1.1rem; } }
        @media (max-width: 480px) { .rbc-header, .rbc-date-cell { font-size: 1.0rem; } }
        @media (max-width: 360px) { .rbc-header, .rbc-date-cell { font-size: 0.9rem; } }
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
            height: '60vh',
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
          <VirtualisedCalendar
            calendarEvents={calendarEvents}
            onSelectSlot={handleSelectSlot}
            getEventStyle={getEventStyle}
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventPropGetter}
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
