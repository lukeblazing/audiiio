// CalendarComponent.jsx (all-in-one)

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import Box from "@mui/material/Box";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  isSameDay,
  isBefore,
  isAfter,
  eachDayOfInterval,
  format,
} from "date-fns";

import LoadingSpinner from "../loading-components/LoadingSpinner";
import DayEventsModal from "./DayEventsModal";


/* ------------------------- utils: buildEventIndexes ------------------------ */

function buildEventIndexes(events) {
  const monthIndex = new Map(); // 'yyyy-MM' -> events[]
  const dayIndex = new Map(); // 'yyyy-MM-dd' -> events[]
  const rgbCache = new Map();

  for (const ev of events) {
    ev._startKey = format(startOfDay(ev.start), "yyyy-MM-dd");
    ev._endKey = format(startOfDay(ev.end), "yyyy-MM-dd");
    ev._rgb = getRgbCached(ev.category_id || "dodgerblue", rgbCache);
  }

  // month index
  for (const ev of events) {
    let m = startOfMonth(ev.start);
    const last = startOfMonth(ev.end);
    while (!isAfter(m, last)) {
      const key = format(m, "yyyy-MM");
      const arr = monthIndex.get(key) || [];
      arr.push(ev);
      monthIndex.set(key, arr);
      m = addMonths(m, 1);
    }
  }

  // day index (eager)
  for (const [monthKey, monthEvents] of monthIndex.entries()) {
    const monthDate = parseMonthKey(monthKey);
    const days = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    });
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      const s = startOfDay(day);
      const e = endOfDay(day);
      const arr = [];
      for (const ev of monthEvents) {
        if (ev.start <= e && ev.end >= s) arr.push(ev);
      }
      if (arr.length) {
        arr.sort((a, b) => a.start - b.start);
        dayIndex.set(key, arr);
      }
    }
  }

  return { monthIndex, dayIndex };
}

function parseMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function getRgbCached(color, cache) {
  if (cache.has(color)) return cache.get(color);
  const rgb = getRgbValues(color);
  cache.set(color, rgb);
  return rgb;
}

function isValidCssColor(color) {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
}

function getRgbValues(color) {
  if (!isValidCssColor(color)) color = "dodgerblue";
  const tempEl = document.createElement("div");
  tempEl.style.color = color;
  document.body.appendChild(tempEl);
  const computed = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);
  const rgbMatch = computed.match(/\d+/g);
  return rgbMatch ? rgbMatch.slice(0, 3).join(",") : "0,0,0";
}

export function eventBackground(borderColor, opacity = 0.3) {
  if (!isValidCssColor(borderColor)) borderColor = "dodgerblue";
  const rgb = getRgbValues(borderColor);
  const isBlack = rgb.replace(/\s/g, '') === "0,0,0";
  if (isBlack) return `rgba(${rgb}, 0.2)`;
  return `rgba(${rgb}, ${opacity})`;
}

/* ------------------------------ MonthGrid view ----------------------------- */

const TOTAL_MONTHS = 16;
const CURRENT_MONTH_INDEX = Math.floor(TOTAL_MONTHS / 2);
const MONTH_ROW_HEIGHT = 700;

function MonthGrid({
  monthIndex,
  dayIndex,
  onDayClick,
  renderEvent,
  today = new Date(),
}) {
  const baseMonth = useMemo(() => startOfMonth(today), [today]);
  const listRef = useRef(null);

  const itemData = useMemo(
    () => ({ monthIndex, dayIndex, onDayClick, baseMonth, today, renderEvent }),
    [monthIndex, dayIndex, onDayClick, baseMonth, today, renderEvent]
  );

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={TOTAL_MONTHS}
            itemSize={MONTH_ROW_HEIGHT}
            overscanCount={3}
            initialScrollOffset={CURRENT_MONTH_INDEX * MONTH_ROW_HEIGHT}
            itemKey={(index) =>
              format(addMonths(baseMonth, index - CURRENT_MONTH_INDEX), "yyyy-MM")
            }
            itemData={itemData}
          >
            {MonthRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

const MonthRow = React.memo(function MonthRow({ index, style, data }) {
  const { dayIndex, onDayClick, baseMonth, today, renderEvent } = data;
  const monthDate = addMonths(baseMonth, index - CURRENT_MONTH_INDEX);

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days = eachDayOfInterval({
    start: gridStart,
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  });

  return (
    <div style={{ ...style, padding: 8 }}>
      <MonthHeader date={monthDate} />
      <WeekdayHeader />
      <div className="mv-grid">
        {days.map((day) => (
          <DayCell
            key={+day}
            date={day}
            isToday={isSameDay(day, today)}
            isPast={isBefore(startOfDay(day), startOfDay(today))}
            events={dayIndex.get(format(day, "yyyy-MM-dd")) || []}
            onDayClick={onDayClick}
            renderEvent={renderEvent}
            inThisMonth={format(day, "MM") === format(monthDate, "MM")}
          />
        ))}
      </div>
    </div>
  );
});

function MonthHeader({ date }) {
  return <div className="mv-month-header">{format(date, "MMMM yyyy")}</div>;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function WeekdayHeader() {
  return (
    <div className="mv-weekdays">
      {WEEKDAY_LABELS.map((d) => (
        <div key={d} className="mv-weekday">
          {d}
        </div>
      ))}
    </div>
  );
}

const DayCell = React.memo(function DayCell({
  date,
  events,
  isToday,
  isPast,
  onDayClick,
  renderEvent,
  inThisMonth,
}) {
  const handleClick = () => onDayClick?.(date, events);

  return (
    <div
      className={[
        "mv-day",
        isToday ? "mv-day--today" : "",
        isPast ? "mv-day--past" : "",
        !inThisMonth ? "mv-day--off" : "",
      ].join(" ")}
      onClick={handleClick}
    >
      <div className="mv-day-label">{format(date, "d")}</div>
      <div className="mv-day-events">
        {events.map((ev, i) => (
          <div
            key={ev.id ?? i}
            className={computeEventClass(date, ev)}
            style={{ "--ev-color": ev._rgb }}
          >
            {renderEvent ? (
              renderEvent(ev, date)
            ) : (
              <strong>
                {ev.title && ev.title !== "Busy" ? ev.title : formatTimeRange(ev)}
              </strong>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

function computeEventClass(date, ev) {
  const currentKey = format(date, "yyyy-MM-dd");
  const startsToday = ev._startKey === currentKey;
  const endsToday = ev._endKey === currentKey;

  if (startsToday && endsToday) return "mv-ev mv-ev--single";
  if (startsToday) return "mv-ev mv-ev--left";
  if (endsToday) return "mv-ev mv-ev--right";
  return "mv-ev mv-ev--mid";
}

function formatTimeRange(event) {
  const s = event.start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const e = event.end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${s} - ${e}`;
}

/* --------------------------------- styles --------------------------------- */

const monthViewCss = String.raw`
  .mv-month-header {
    text-align: center;
    padding: 8px 0;
    font-weight: 800;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  }
  .mv-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    font-weight: bold;
    margin-bottom: 4px;
  }
  .mv-weekday { text-align: center; }
  .mv-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: minmax(70px, 1fr);
    gap: 0;
  }
  .mv-day {
    position: relative;
    padding: 2px 4px 4px 4px;
    cursor: pointer;
    overflow: hidden;
  }
  .mv-day--today { position: relative; }
  .mv-day--today::after {
    content: "";
    position: absolute;
    pointer-events: none;
    top: 2px; left: 2px; right: 2px; bottom: 2px;
    border: 2px solid var(--primary-color, #1976d2);
    border-radius: 6px;
  }
  .mv-day--past { filter: brightness(0.95); }
  .mv-day--off { visibility: hidden; pointer-events: none; }
  .mv-day-label { font-size: 0.9rem; margin-bottom: 2px; }
  .mv-day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .mv-ev {
    font-size: 0.5rem;
    background: rgba(var(--ev-color, 0,0,0), 0.3);
    padding: 2px 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mv-ev--left {
    border: 2px solid rgb(var(--ev-color));
    border-right: none;
    border-radius: 5px 0 0 5px;
  }
  .mv-ev--right {
    border: 2px solid rgb(var(--ev-color));
    border-left: none;
    border-radius: 0 5px 5px 0;
  }
  .mv-ev--mid {
    border-top: 2px solid rgb(var(--ev-color));
    border-bottom: 2px solid rgb(var(--ev-color));
  }
  .mv-ev--single {
    border: 2px solid rgb(var(--ev-color));
    border-radius: 5px;
  }
`;

/* ---------------------------- CalendarComponent ---------------------------- */

export default function CalendarComponent() {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [dayEventsModalOpen, setDayEventsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/calendar/getAllEventsForUser`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch events");
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
  }, []);

  const { monthIndex, dayIndex } = useMemo(
    () => buildEventIndexes(calendarEvents),
    [calendarEvents]
  );

  const handleDayClick = useCallback((date) => {
    setSelectedDate(date);
    setDayEventsModalOpen(true);
  }, []);

  return (
    <>
      <style>{monthViewCss}</style>

      {isEventsLoading ? (
        <LoadingSpinner />
      ) : (
        <Box
          sx={{
            position: "fixed",
            top: "calc(150px + env(safe-area-inset-top))",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90vw",
            maxWidth: "1000px",
            height: "60vh",
            maxHeight: "750px",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            bgcolor: "background.paper",
            borderRadius: 1,
            border: (theme) => `2px solid ${theme.palette.divider}`,
            boxShadow: 3,
          }}
        >
          <MonthGrid
          monthIndex={monthIndex}
          dayIndex={dayIndex}
          onDayClick={handleDayClick}
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
}
