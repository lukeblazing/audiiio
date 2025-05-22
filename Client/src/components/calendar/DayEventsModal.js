// EventModal.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Modal,
  Typography,
  IconButton,
  Button,
  TextField,
  Stack,
  Collapse
} from '@mui/material';
import { Add, Remove, ArrowBackIosNew, Mic, Stop } from '@mui/icons-material';
import {
  format,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  isSameDay,
  isWithinInterval
} from 'date-fns';
import { useAuth } from '../authentication/AuthContext';
import { eventBackground } from './CalendarComponent';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CircularProgress from '@mui/material/CircularProgress';

/* ───────────────────────── helpers ───────────────────────── */

const isAllDayEvent = (event, currentDay) => {
  const eventStart = startOfDay(event.start);
  const eventEnd = startOfDay(event.end);
  const day = startOfDay(currentDay);

  const startsBeforeDay = isBefore(eventStart, day);
  const endsOnOrAfterDay = isAfter(eventEnd, day) || isSameDay(eventEnd, day);
  return startsBeforeDay && endsOnOrAfterDay;
};

export const formatFullEventTime = (event, date) => {
  if (isAllDayEvent(event, date)) return 'All-day';

  const fmt = (d) =>
    format(d, 'h:mm a').toLowerCase().replace(':00', '');

  // show only start if there’s no end or the end is 11:59 PM
  if (!event.end || (event.end.getHours() === 23 && event.end.getMinutes() === 59))
    return fmt(event.start);

  // if it ends on a different day just show the start
  if (!isSameDay(event.end, date)) return fmt(event.start);

  return `${fmt(event.start)} - ${fmt(event.end)}`;
};

const isValidCssColor = (c) => {
  const s = new Option().style;
  s.color = c;
  return s.color !== '';
};

const getBorderColor = (category) =>
  isValidCssColor(category) ? category : 'dodgerblue';

const sharedModalBoxSx = {
  backdropFilter: 'blur(20px)',
  borderRadius: 2,
  border: '1px solid #ccc',
  boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
  p: 2,
  maxWidth: '90vw',
  maxHeight: '80vh',
  width: '100%',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

/* ══════════════════════  main component ═════════════════════ */

function DayEventsModal({
  open,
  onClose,
  selectedDate,
  calendarEvents = [],
  fetchCalendarEvents
}) {

  const { isAuthenticated, userData } = useAuth();
  const [mode, setMode] = useState('view'); // 'view' | 'create' | 'remove' | 'confirm_remove'
  const [eventToDelete, setEventToDelete] = useState(null);
  const [openDescAndColor, setOpenDescAndColor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Audio input - improved
  const MAX_SECONDS = 60;
  const MIN_SECONDS = 2;

  const [isRecording, setIsRecording] = useState(false);
  const [isMicLoading, setIsMicLoading] = useState(false);
  const [micError, setMicError] = useState(null);
  const recordingStartTimeRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
      if (mediaRecorderRef.current?.state === 'recording') stopRecording();
    };
  }, []);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    if (isRecording || isMicLoading || !window.MediaRecorder) return;
    setIsMicLoading(true);
    setMicError(null);

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setIsMicLoading(false);
      setMicError('Unsupported recording format.');
      console.warn('No supported audio format');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      const controller = new AbortController();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onerror = (event) => {
        if (!isMountedRef.current) return;
        setIsMicLoading(false);
        setIsRecording(false);
        setMicError('Mic error.');
        console.warn('Microphone error:', event.error);
      };

      mediaRecorder.onstop = async () => {
        if (!isMountedRef.current) return;
        setIsRecording(false);
        setIsMicLoading(true);

        const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
        recordingStartTimeRef.current = null;

        if (duration < MIN_SECONDS || duration > MAX_SECONDS) {
          setMicError(duration < MIN_SECONDS ? 'Too short.' : 'Too long.');
          console.warn('Invalid duration:', duration);
          setIsMicLoading(false);
          return;
        }

        try {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const formData = new FormData();
          formData.append('audio', blob, `event.${mimeType.split('/')[1]}`);
          formData.append('selected_date', selectedDate.toISOString());

          const endpoint = process.env.REACT_APP_API_BASE_URL
            ? `${process.env.REACT_APP_API_BASE_URL}/calendar/createEventAudioInput`
            : '/createEventAudioInput';

          const res = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            signal: controller.signal,
          });

          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error || 'Upload failed');

          fetchCalendarEvents();
        } catch (err) {
          if (!isMountedRef.current) return;
          setMicError('Upload error.');
          console.warn('Upload failed:', err);
        } finally {
          recordedChunksRef.current = [];
          setIsMicLoading(false);
        }
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      setIsMicLoading(false);

      recordTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') stopRecording();
      }, MAX_SECONDS * 1000);
    } catch (err) {
      if (!isMountedRef.current) return;
      setIsMicLoading(false);
      setIsRecording(false);
      setMicError('Mic unavailable or permission denied.');
      console.warn('getUserMedia error:', err);
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (isMicLoading || !mr || mr.state !== 'recording') return;

    try {
      mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      if (recordTimeoutRef.current) {
        clearTimeout(recordTimeoutRef.current);
        recordTimeoutRef.current = null;
      }
    } catch (err) {
      console.warn('Error stopping recording:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (recordTimeoutRef.current) {
        clearTimeout(recordTimeoutRef.current);
        recordTimeoutRef.current = null;
      }
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    category_id: '',
    start: '',
    end_time: ''
  });

  const eventsOnDate = React.useMemo(() => {
    if (!selectedDate) return [];
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    return calendarEvents.filter(
      (event) =>
        isWithinInterval(event.start, { start: dayStart, end: dayEnd }) ||
        isWithinInterval(event.end, { start: dayStart, end: dayEnd }) ||
        (event.start < dayStart && event.end > dayEnd)
    ).sort((a, b) => a.start - b.start);
  }, [calendarEvents, selectedDate]);

  // Handle Create Event form submission
  const onCreateEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!newEvent.title || !newEvent.start) {
      alert('Please fill in required fields: Title, and Start Time.');
      return;
    }
    let endTime = newEvent.end_time ? new Date(newEvent.end_time) : null;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            ...newEvent,
            start: new Date(newEvent.start).toISOString(),
            end_time: endTime ? endTime.toISOString() : null,
            created_by: userData ? userData.email : ''
          },
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create event');
      // Reset form and close modal on success
      setNewEvent({
        calendar_id: '',
        category_id: '',
        title: '',
        description: '',
        start: '',
        end_time: '',
        recurrence_rule: '',
      });
      setMode('view')
      // Refresh events after creation
      fetchCalendarEvents();
    } catch (err) {
      console.error(err);
      alert('Error creating event');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete an event
  const onDeleteEvent = async (eventId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/event`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { id: eventId } }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete event');
      setMode('view');
      fetchCalendarEvents();
    } catch (err) {
      console.error(err);
      alert('Error deleting event');
    } finally {
      setIsLoading(false);
    }
  };


  const askDelete = (ev) => {
    setEventToDelete(ev);
    setMode('confirm_remove');
  };

  /* ───────── JSX fragments ───────── */

  const Header = (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 1
      }}
    >
      {(mode === 'view' && isAuthenticated) ? (
        <IconButton aria-label="remove" onClick={() => setMode('remove')}>
          <Remove />
        </IconButton>
      ) : (isAuthenticated && (
        <IconButton aria-label="back" onClick={() => setMode('view')}>
          <ArrowBackIosNew />
        </IconButton>)
      )}

      <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
        {mode === 'create'
          ? 'Create Event'
          : mode === 'remove'
            ? 'Delete Event'
            : mode === 'confirm_remove'
              ? 'Delete?'
              : (selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '')
        }
      </Typography>

      {(mode === 'view' && isAuthenticated) ? (
        <IconButton
          aria-label="add"
          sx={{ fontSize: 50 }}
          onClick={() => {
            const defaultStart = new Date(selectedDate);
            defaultStart.setHours(8, 0, 0, 0);
            setNewEvent({
              title: '',
              description: '',
              category_id: '',
              start: defaultStart,
              end_time: '',
            });
            setMode('create');
          }}
        >
          <Add />
        </IconButton>
      ) : (isAuthenticated && (
        <Box sx={{ width: 40 }} /> /* spacer */
      ))}
    </Box>
  );

  const ViewBody = (
    <Box sx={{ width: '100%', maxHeight: '60vh', overflowY: 'auto', px: 1 }}>
      {eventsOnDate.length ? (
        eventsOnDate.map((ev, idx) => (
          <Typography
            key={idx}
            sx={{
              background: eventBackground(ev.category_id),
              borderRadius: 1,
              p: 1.5, mb: 1,
              border: `1px solid ${getBorderColor(ev.category_id)}`
            }}
          >
            <strong>{formatFullEventTime(ev, selectedDate)}</strong> {ev.title}
            {ev.description && <> <br />• {ev.description}</>}
          </Typography>
        ))
      ) : (
        <Typography sx={{ opacity: .8, textAlign: 'center' }}>
          We're free!
        </Typography>
      )}
    </Box>
  );

  const CreateBody = (
    <Box component="form" onSubmit={onCreateEvent} sx={{ width: '100%', px: 1 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <TextField
          label="Title" fullWidth required margin="normal"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />
        <IconButton
          disableRipple
          onClick={() => setOpenDescAndColor((prev) => !prev)}
          aria-label={
            openDescAndColor ? 'Collapse optional fields' : 'Expand optional fields'
          }
          sx={{
            mt: 2, // aligns the button with the TextField’s label
            height: 56, // same as TextField height
            width: 56, // square shape
            borderRadius: '6px', // matches TextField rounded corners
            color: '#fff', // text color
            backgroundColor: 'transparent', // same as TextField background
            border: '1px solid rgba(255,255,255,0.23)', // matching border
            transition: 'transform 0.25s, background-color 0.2s',
            transform: openDescAndColor ? 'rotate(180deg)' : 'none',
          }}
          size="small"
        >
          <ExpandMoreIcon />
        </IconButton>
      </Stack>
      <Collapse in={openDescAndColor} timeout="auto" unmountOnExit>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Description" fullWidth margin="normal"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />
          <TextField
            label="Color" fullWidth margin="normal"
            value={newEvent.category_id}
            onChange={(e) => setNewEvent({ ...newEvent, category_id: e.target.value })}
          />
        </Stack>
      </Collapse>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <TextField
          required
          label="Start Time"
          type="time"
          fullWidth
          margin="normal"
          sx={{
            '& input[type="time"]': {
              WebkitAppearance: 'none', // Disable native iOS appearance
              MozAppearance: 'textfield', // For Firefox
              appearance: 'textfield', // General CSS property
              height: 56, // Match MUI's default TextField height
              padding: '0 14px', // Adjusted padding to center the text vertically
              lineHeight: 'normal', // Reset line height to normal
              display: 'flex', // Use flex to align items
              alignItems: 'center', // Vertically center
              boxSizing: 'border-box',
              borderRadius: 4,
            },
            '& input::-webkit-calendar-picker-indicator': {
              opacity: 1,
              width: 24,
              height: 24,
              cursor: 'pointer',
            },
          }}
          value={
            newEvent.start
              ? `${String(new Date(newEvent.start).getHours()).padStart(2, '0')}:${String(new Date(newEvent.start).getMinutes()).padStart(2, '0')}`
              : '08:00'
          }
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(':').map(Number);
            const baseDate = newEvent.start ? new Date(newEvent.start) : new Date(selectedDate);
            baseDate.setHours(hours, minutes, 0, 0);
            setNewEvent({ ...newEvent, start: baseDate });
          }}
        />
        <TextField
          label="End Time"
          type="datetime-local"
          fullWidth
          margin="normal"
          sx={{
            '& input[type="datetime-local"]': {
              WebkitAppearance: 'none',
              MozAppearance: 'textfield',
              appearance: 'textfield',
              height: 56,
              padding: '0 14px',
              lineHeight: 'normal',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              borderRadius: 4,
            },
            '& input::-webkit-calendar-picker-indicator': {
              opacity: 1,
              width: 24,
              height: 24,
              cursor: 'pointer',
            },
          }}
          value={
            newEvent.end_time
              ? format(new Date(newEvent.end_time), "yyyy-MM-dd'T'HH:mm")
              : ''
          }
          onChange={(e) => {
            const date = new Date(e.target.value);
            setNewEvent({ ...newEvent, end_time: date });
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
        <Button disableRipple variant="outlined" onClick={() => setMode('view')}>Cancel</Button>
        <Button disableRipple variant="contained" disabled={isLoading} type="submit" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isLoading ? <>
            <CircularProgress size={20} color="inherit" />
            Creating…
          </> : 'Create'}
        </Button>
      </Box>
    </Box>
  );

  const RemoveBody = (
    <>
      <Box sx={{ width: '100%', maxHeight: '60vh', overflowY: 'auto', px: 1 }}>
        {eventsOnDate.length ? (
          eventsOnDate.map((ev, idx) => (
            <Typography
              key={idx}
              sx={{
                background: eventBackground(ev.category_id),
                borderRadius: 1,
                p: 1.5, mb: 1,
                border: `1px solid ${getBorderColor(ev.category_id)}`
              }}
              onClick={() => askDelete(ev)}
            >
              <strong>{formatFullEventTime(ev, selectedDate)}</strong> {ev.title}
              {ev.description && <> <br />• {ev.description}</>}
            </Typography>
          ))
        ) : (
          <Typography sx={{ opacity: .8, textAlign: 'center' }}>
            No events to delete.
          </Typography>
        )}
      </Box>


      <Button
        disableRipple
        sx={{ mt: 2, maxWidth: 200, alignSelf: 'center' }}
        variant="outlined"
        onClick={() => setMode('view')}
      >
        Back
      </Button>
    </>
  );

  const ConfirmRemoveBody = (
    <>
      {eventToDelete && (
        <>
          <Box sx={{ width: '100%', maxHeight: '60vh', overflowY: 'auto', px: 1 }}>
            <Typography
              sx={{
                background: eventBackground(eventToDelete.category_id),
                borderRadius: 1,
                p: 1.5,
                mb: 1,
                border: `1px solid ${getBorderColor(eventToDelete.category_id)}`
              }}
            >
              <strong>{formatFullEventTime(eventToDelete, selectedDate)}</strong> {eventToDelete.title}
              {eventToDelete.description && <> <br />• {eventToDelete.description}</>}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
            <Button disableRipple variant="outlined" onClick={() => setMode('remove')}>Cancel</Button>
            <Button disableRipple variant="contained" disabled={isLoading} sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={() => onDeleteEvent(eventToDelete.id)}>
              {isLoading ? <>
                <CircularProgress size={20} color="inherit" />
                Deleting...
              </> : 'Confirm'}
            </Button>
          </Box>
        </>
      )}
    </>
  );


  /* ───────── render ───────── */

  return (
    <>
      {/* main modal */}
      <Modal open={open} onClose={onClose} disableAutoFocus disableEnforceFocus>
        <Box sx={sharedModalBoxSx}>
          {Header}
          {mode === 'view' && ViewBody}
          {mode === 'create' && CreateBody}
          {mode === 'remove' && RemoveBody}
          {mode === 'confirm_remove' && ConfirmRemoveBody}
          {mode === 'view' && (
            <Button
              disableRipple
              sx={{ mt: 2, maxWidth: 200 }}
              variant="contained"
              onClick={onClose}
            >
              Close
            </Button>
          )}
          {/* ── microphone button ───────────────────────── */}
          {mode === 'view' && isAuthenticated && window.MediaRecorder && (
            <IconButton
              aria-label="Start recording"
              aria-pressed={isRecording}
              onClick={startRecording}
              disabled={isMicLoading}
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
              }}
            >
              {isMicLoading ? <CircularProgress size={28} /> : <Mic />}
            </IconButton>
          )}
        </Box>
      </Modal>
      {/* ── recording overlay ─────────────────────────── */}
      {isRecording && (
        <Box
          role="dialog"
          aria-label="Recording in progress"
          sx={{
            position: 'fixed',
            inset: 0,
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0,0,0,0.25)',
            zIndex: 1301,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={stopRecording}
            sx={{
              bgcolor: 'error.main',
              color: '#fff',
              width: 80,
              height: 80,
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <Stop sx={{ fontSize: 40 }} />
          </IconButton>
        </Box>
      )}


    </>
  );
}

export default DayEventsModal;
