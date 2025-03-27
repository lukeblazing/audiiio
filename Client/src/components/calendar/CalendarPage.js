import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Slide
} from '@mui/material';
import AddUnits from '@mui/icons-material/AdUnits';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AppNavbar from '../dashboard/AppNavbar';
import CalendarComponent from './CalendarComponent';
import SignIn from '../authentication/SignIn';
import { useAuth } from '../authentication/AuthContext';

function CalendarPage() {
  const { isAuthenticated, userData } = useAuth();
  const [pressedButton, setPressedButton] = useState(null);

  // Modal open/close states
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [calendarSwitcherModalOpen, setCalendarSwitcherModalOpen] = useState(false);
  const [createCalendarModalOpen, setCreateCalendarModalOpen] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  // Event fetching state: events and loading flag
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State for Create Event modal: new event form
  const [newEvent, setNewEvent] = useState({
    calendar_id: '',
    category_id: '',
    title: '',
    description: '',
    start: '',
    end_time: '',
    recurrence_rule: '',
  });

  // State for Create Calendar modal: new calendar form
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    description: '',
  });

  // State for available calendars (for dropdown and filtering)
  const [calendars, setCalendars] = useState([]);
  // State for selected calendars for filtering the events displayed
  const [selectedCalendarFilters, setSelectedCalendarFilters] = useState([]);

  // State for deletion: selected event to delete
  const [selectedEventForDelete, setSelectedEventForDelete] = useState(null);

  // Animate buttons on press
  const handlePress = (button) => {
    setPressedButton(button);
    setTimeout(() => setPressedButton(null), 200);
  };

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
  }, [isAuthenticated, removeModalOpen]);
  
  // Fetch calendars when create, calendar switcher, or create calendar modal opens
  const fetchCalendars = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/getCalendarsForUser`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch calendars');
      const data = await response.json();
      setCalendars(data.calendars || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (createModalOpen || calendarSwitcherModalOpen || createCalendarModalOpen) {
      fetchCalendars();
    }
  }, [createModalOpen, calendarSwitcherModalOpen, createCalendarModalOpen]);

  // Function to fetch available users from subscriptions table
  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/availableUsers`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch available users');
      const data = await response.json();
      setAvailableUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch available users when the message modal opens.
  useEffect(() => {
    if (messageModalOpen) {
      fetchAvailableUsers();
    }
  }, [messageModalOpen]);

  // Filter events for Remove Event modal based on search query
  const filteredEvents = calendarEvents.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter calendar events based on the selected calendar filters.
  // If no filters are selected, show all events.
  const filteredCalendarEvents =
    selectedCalendarFilters.length > 0
      ? calendarEvents.filter((event) => selectedCalendarFilters.includes(event.calendar_id))
      : calendarEvents;

  // Function to delete an event
  const deleteEvent = async (eventId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/event`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { id: eventId } }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete event');
      setCalendarEvents((prev) => prev.filter((event) => event.id !== eventId));
      setConfirmDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error deleting event');
    }
  };

  // Handle Create Event form submission
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.calendar_id || !newEvent.title || !newEvent.start) {
      alert('Please fill in required fields: Calendar, Title, and Start Time.');
      return;
    }
    let endTime = newEvent.end_time;
    if (!endTime) {
      const startDate = new Date(newEvent.start);
      startDate.setHours(23, 59, 0, 0);
      endTime = startDate; // use Date object directly
    } else {
      endTime = new Date(newEvent.end_time);
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            ...newEvent,
            start: new Date(newEvent.start).toISOString(),
            end_time: endTime.toISOString(),
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
      setCreateModalOpen(false);
      // Refresh events after creation
      fetchCalendarEvents();
    } catch (err) {
      console.error(err);
      alert('Error creating event');
    }
  };

  // Handle Create Calendar form submission
  const handleCreateCalendar = async (e) => {
    e.preventDefault();
    if (!newCalendar.name) {
      alert('Calendar name is required.');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendar: newCalendar }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to create calendar');
      setNewCalendar({ name: '', description: '' });
      setCreateCalendarModalOpen(false);
      fetchCalendars();
    } catch (err) {
      console.error(err);
      alert('Error creating calendar');
    }
  };

  // Toggle calendar filter selection
  const toggleCalendarFilter = (calendarId) => {
    setSelectedCalendarFilters((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  // Updated message submission handler: call /api/sendNotification
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecipient || !messageInput) {
      alert('Please select a recipient and enter a message.');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/sendNotification`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: selectedRecipient,
          title: 'New Message',
          body: messageInput,
          url: '/messages', // adjust as needed
        }),
      });
      const data = await response.json();
      if (response.ok) {
        if (Notification.permission === 'granted') {
          new Notification('Notification sent successfully!');
        }
      } else {
        if (Notification.permission === 'granted') {
          new Notification('Notification sent successfully!');
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification');
    }
    setMessageInput('');
    setSelectedRecipient('');
    setMessageModalOpen(false);
  };

  // Toggle Select All functionality for calendar filters
  const handleSelectAllToggle = () => {
    if (selectedCalendarFilters.length === calendars.length) {
      setSelectedCalendarFilters([]);
    } else {
      setSelectedCalendarFilters(calendars.map((cal) => cal.id));
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <SignIn />
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            position: 'fixed',
            width: '100vw',
          }}
        >
          <AppNavbar />

          {/* Buttons Container */}
          <Box
            sx={{
              position: 'absolute',
              top: 60,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          >
            <IconButton
              sx={{
                width: 50,
                height: 50,
                borderRadius: '12px',
                minWidth: 'auto',
                border: '2px solid ${theme.palette.divider}',
                background: 'transparent',
                color: '#2196F3',
                transition: 'transform 0.2s ease-in-out',
                transform: pressedButton === 'calendar' ? 'scale(0.7)' : 'scale(1)',
              }}
              disableRipple
              onMouseDown={() => handlePress('calendar')}
              onClick={() => setCalendarSwitcherModalOpen(true)}
            >
              <CalendarTodayIcon />
            </IconButton>

            <Button
              variant="outlined"
              sx={{
                width: 100,
                height: 50,
                borderRadius: '12px',
                minWidth: 'auto',
                border: '2px solid ${theme.palette.divider}',
                background: 'transparent',
                color: '#2196F3',
                transition: 'transform 0.2s ease-in-out',
                fontSize: '2rem',
                transform: pressedButton === 'remove' ? 'scale(0.7)' : 'scale(1)',
              }}
              disableRipple
              onMouseDown={() => handlePress('remove')}
              onClick={() => setRemoveModalOpen(true)}
            >
              –
            </Button>

            <Button
              variant="outlined"
              sx={{
                width: 100,
                height: 50,
                borderRadius: '12px',
                minWidth: 'auto',
                border: '2px solid ${theme.palette.divider}',
                background: 'transparent',
                color: '#2196F3',
                transition: 'transform 0.2s ease-in-out',
                fontSize: '2rem',
                transform: pressedButton === 'add' ? 'scale(0.7)' : 'scale(1)',
              }}
              disableRipple
              onMouseDown={() => handlePress('add')}
              onClick={() => setCreateModalOpen(true)}
            >
              +
            </Button>

            <IconButton
              sx={{
                width: 50,
                height: 50,
                borderRadius: '12px',
                minWidth: 'auto',
                border: '2px solid ${theme.palette.divider}',
                background: 'transparent',
                color: '#2196F3',
                transition: 'transform 0.2s ease-in-out',
                transform: pressedButton === 'message' ? 'scale(0.7)' : 'scale(1)',
              }}
              disableRipple
              onMouseDown={() => handlePress('message')}
              onClick={() => setMessageModalOpen(true)}
            >
              <AddUnits />
            </IconButton>
          </Box>

          {/* Calendar Container */}
          <Box
            sx={{
              width: '100%',
              maxWidth: 900,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              marginTop: '130px',
              maxHeight: '50vh',
              zIndex: 1,
            }}
          >
            <CalendarComponent
              events={filteredCalendarEvents}
              isLoading={isEventsLoading}
              selectedCalendars={selectedCalendarFilters}
            />
          </Box>

          {/* Calendar Switcher Modal */}
          <Modal
            open={calendarSwitcherModalOpen}
            onClose={() => setCalendarSwitcherModalOpen(false)}
            aria-labelledby="calendar-switcher-modal-title"
            aria-describedby="calendar-switcher-modal-description"
            BackdropProps={{
              sx: {
                backgroundColor: '${theme.palette.divider}',
                backdropFilter: 'blur(20px)',
              },
            }}
          >
            {/* A container to center the slide */}
            <Box
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Slide direction="up" in={calendarSwitcherModalOpen} mountOnEnter unmountOnExit>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 480,
                    backdropFilter: 'blur(20px)',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px',
                    p: 4,
                    boxShadow: '0px -5px 15px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <Typography
                    id="calendar-switcher-modal-title"
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      textAlign: 'center',
                      mb: 3,
                    }}
                  >
                    Select Calendar
                  </Typography>
                  <List
                    id="calendar-switcher-modal-description"
                    sx={{
                      maxHeight: '50vh',
                      overflowY: 'auto',
                      mb: 3,
                      padding: 0,
                    }}
                  >
                    {calendars.length > 0 ? (
                      calendars.map((cal) => (
                        <ListItem
                          key={cal.id}
                          button
                          onClick={() => toggleCalendarFilter(cal.id)}
                          sx={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: '40px' }}>
                            <Switch
                              edge="start"
                              checked={selectedCalendarFilters.includes(cal.id)}
                              inputProps={{ 'aria-label': cal.name }}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#fff',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#007BFF',
                                },
                                '& .MuiSwitch-thumb': {
                                  backgroundColor: '#007BFF',
                                },
                                '& .MuiSwitch-track': {
                                  backgroundColor: '#ccc',
                                },
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={cal.name}
                            primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem sx={{ padding: '8px 12px' }}>
                        <ListItemText
                          primary="No calendars available"
                          primaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                    )}
                    {calendars.length > 0 && (
                      <ListItem
                        button
                        onClick={handleSelectAllToggle}
                        sx={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: '40px' }}>
                          <Switch
                            edge="start"
                            checked={selectedCalendarFilters.length === calendars.length}
                            inputProps={{ 'aria-label': 'Select All' }}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#fff',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#007BFF',
                              },
                              '& .MuiSwitch-thumb': {
                                backgroundColor: '#007BFF',
                              },
                              '& .MuiSwitch-track': {
                                backgroundColor: '#ccc',
                              },
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary="Select All"
                          primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                        />
                      </ListItem>
                    )}
                  </List>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2}}>
                    <Button disableRipple
                      onClick={() => {
                        setCalendarSwitcherModalOpen(false);
                        setCreateCalendarModalOpen(true);
                      }}
                      sx={{
                        backgroundColor: '#007BFF',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        textTransform: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      New Calendar
                    </Button>
                    <Button disableRipple
                      onClick={() => setCalendarSwitcherModalOpen(false)}
                      sx={{
                        border: '1px solid #ccc',
                        color: '#ffff',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        textTransform: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              </Slide>
            </Box>
          </Modal>

          {/* Remove Event Modal */}
          <Modal
            open={removeModalOpen}
            onClose={() => setRemoveModalOpen(false)}
            aria-labelledby="remove-event-modal-title"
            aria-describedby="remove-event-modal-description"
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.5)' } }}
          >
            <Box
              sx={{
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
                padding: '16px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                width: '100%',
                margin: 'auto',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #ccc',
              }}
            >
              <Typography
                id="remove-event-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: '600',
                  fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                Remove Event
              </Typography>
              <TextField
                fullWidth
                placeholder="Search events..."
                variant="outlined"
                margin="normal"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  input: {
                    color: 'white',
                    '&::placeholder': { color: 'white', opacity: 1 },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                }}
              />
              <Box
                id="remove-event-modal-description"
                sx={{
                  mt: 2,
                  width: '100%',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  padding: '0 8px',
                }}
              >
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, index) => (
                    <Box
                      key={index}
                      sx={{
                        backdropFilter: 'blur(20px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedEventForDelete(event);
                        setConfirmDeleteModalOpen(true);
                      }}
                    >
                      <Typography variant="subtitle1">
                        <strong>{event.title}</strong>
                      </Typography>
                      {event.description && (
                        <Typography variant="body2">{event.description}</Typography>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ opacity: 0.8, fontSize: '1rem', textAlign: 'center' }}>
                    No events found.
                  </Typography>
                )}
              </Box>
              <Button
                onClick={() => setRemoveModalOpen(false)}
                variant="contained"
                disableRipple
                sx={{
                  mt: 2,
                  width: '100%',
                  maxWidth: '200px',
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderRadius: '8px',
                }}
              >
                Close
              </Button>
            </Box>
          </Modal>

          {/* Confirmation Modal for Deleting an Event */}
          <Modal
            open={confirmDeleteModalOpen}
            onClose={() => setConfirmDeleteModalOpen(false)}
            aria-labelledby="confirm-delete-modal-title"
            aria-describedby="confirm-delete-modal-description"
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0)' } }}
          >
            <Box
              sx={{
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
                padding: '16px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                width: '100%',
                margin: 'auto',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography
                id="confirm-delete-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                Confirm Cancellation
              </Typography>
              {selectedEventForDelete && (
                <Box
                  sx={{
                    mt: 2,
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    padding: '12px',
                    textAlign: 'left',
                  }}
                >
                  <Typography variant="subtitle1">
                    <strong>{selectedEventForDelete.title}</strong>
                  </Typography>
                  {selectedEventForDelete.description && (
                    <Typography variant="body2">
                      {selectedEventForDelete.description}
                    </Typography>
                  )}
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%', maxWidth: '200px' }}>
                <Button
                  onClick={() => setConfirmDeleteModalOpen(false)}
                  variant="outlined"
                  disableRipple
                  sx={{ color: 'white' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => deleteEvent(selectedEventForDelete.id)}
                  variant="contained"
                  disableRipple
                >
                  Confirm
                </Button>
              </Box>
            </Box>
          </Modal>

          {/* Create Event Modal */}
          <Modal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            aria-labelledby="create-event-modal-title"
            aria-describedby="create-event-modal-description"
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.5)' } }}
          >
            <Box
              component="form"
              onSubmit={handleCreateEvent}
              sx={{
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
                padding: '16px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                width: '100%',
                margin: 'auto',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #ccc',
              }}
            >
              <Typography
                id="create-event-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: '600',
                  fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                New Event!
              </Typography>

              {/* Calendar select with updated dropdown styling */}
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: 'white' }} id="calendar-select-label">Calendar</InputLabel>
                <Select
                  labelId="calendar-select-label"
                  id="calendar-select"
                  value={newEvent.calendar_id}
                  label="Calendar"
                  onChange={(e) => setNewEvent({ ...newEvent, calendar_id: e.target.value })}
                  required
                  sx={{
                    backgroundColor: 'transparent',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                  }}
                >
                  {calendars.map((cal) => (
                    <MenuItem key={cal.id} value={cal.id}>
                      {cal.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Title"
                variant="outlined"
                margin="normal"
                fullWidth
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
                sx={{
                  input: {
                    color: 'white',
                    '&::placeholder': {
                      color: 'white',
                      opacity: 1,
                    },
                  },
                  label: {
                    color: 'white',
                  },
                  '& label.Mui-focused': {
                    color: 'white',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                }}
              />

              <TextField
                label="Description"
                variant="outlined"
                margin="normal"
                fullWidth
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                sx={{
                  input: {
                    color: 'white',
                    '&::placeholder': {
                      color: 'white',
                      opacity: 1,
                    },
                  },
                  label: {
                    color: 'white',
                  },
                  '& label.Mui-focused': {
                    color: 'white',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                }}
              />

              <TextField
                label="Color"
                variant="outlined"
                margin="normal"
                fullWidth
                value={newEvent.category_id}
                onChange={(e) => setNewEvent({ ...newEvent, category_id: e.target.value })}
                sx={{
                  input: {
                    color: 'white',
                    '&::placeholder': {
                      color: 'white',
                      opacity: 1,
                    },
                  },
                  label: {
                    color: 'white',
                  },
                  '& label.Mui-focused': {
                    color: 'white',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                }}
              />

              <TextField
                label="Start"
                type="datetime-local"
                variant="outlined"
                margin="normal"
                fullWidth
                InputLabelProps={{ shrink: true, style: { color: 'white' } }}
                value={newEvent.start}
                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                required
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                }}
              />

              <TextField
                label="End Time (Optional)"
                type="datetime-local"
                variant="outlined"
                margin="normal"
                fullWidth
                InputLabelProps={{ shrink: true, style: { color: 'white' } }}
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                }}
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%', justifyContent: 'center' }}>
                <Button
                  onClick={() => setCreateModalOpen(false)}
                  variant="outlined"
                  disableRipple
                  sx={{ color: 'white' }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disableRipple>
                  Create Event
                </Button>
              </Box>
            </Box>
          </Modal>

          {/* Create Calendar Modal */}
          <Modal
            open={createCalendarModalOpen}
            onClose={() => setCreateCalendarModalOpen(false)}
            aria-labelledby="create-calendar-modal-title"
            aria-describedby="create-calendar-modal-description"
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.5)' } }}
          >
            <Box
              component="form"
              onSubmit={handleCreateCalendar}
              sx={{
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
                padding: '16px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                width: '100%',
                margin: 'auto',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #ccc',
              }}
            >
              <Typography
                id="create-calendar-modal-title"
                variant="h6"
                component="h2"
                sx={{ fontWeight: '600', textAlign: 'center', width: '100%' }}
              >
                Create New Calendar
              </Typography>
              <TextField
                label="Calendar Name"
                variant="outlined"
                margin="normal"
                fullWidth
                value={newCalendar.name}
                onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                required
                sx={{
                  input: {
                    color: 'white',
                    '&::placeholder': { color: 'white', opacity: 1 },
                  },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                }}
              />
              <TextField
                label="Description"
                variant="outlined"
                margin="normal"
                fullWidth
                value={newCalendar.description}
                onChange={(e) => setNewCalendar({ ...newCalendar, description: e.target.value })}
                sx={{
                  input: {
                    color: 'white',
                    '&::placeholder': { color: 'white', opacity: 1 },
                  },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%', justifyContent: 'center' }}>
                <Button
                  onClick={() => setCreateCalendarModalOpen(false)}
                  variant="outlined"
                  disableRipple
                  sx={{ color: 'white' }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disableRipple>
                  Create Calendar
                </Button>
              </Box>
            </Box>
          </Modal>

          {/* Messages Modal */}
          <Modal
            open={messageModalOpen}
            onClose={() => setMessageModalOpen(false)}
            aria-labelledby="message-modal-title"
            aria-describedby="message-modal-description"
            BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.5)' } }}
          >
            <Box
              component="form"
              onSubmit={handleMessageSubmit}
              sx={{
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
                padding: '16px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                width: '100%',
                margin: 'auto',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #ccc',
              }}
            >
              <Typography
                id="message-modal-title"
                variant="h6"
                component="h2"
                sx={{ fontWeight: '600', textAlign: 'center', width: '100%' }}
              >
                Send Message
              </Typography>
              {/* Recipient select with updated dropdown styling */}
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: 'white' }} id="recipient-select-label">Recipient</InputLabel>
                <Select
                  labelId="recipient-select-label"
                  id="recipient-select"
                  value={selectedRecipient}
                  label="Recipient"
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  required
                  sx={{
                    backgroundColor: 'transparent',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                  }}
                >
                  {availableUsers.map((user) => (
                    <MenuItem key={user.id} value={user.email}>
                      {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                placeholder="Enter your message"
                variant="outlined"
                margin="normal"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                required
                sx={{
                  input: {
                    color: 'white',
                    '&::placeholder': { color: 'white', opacity: 1 },
                  },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%', justifyContent: 'center' }}>
                <Button
                  onClick={() => setMessageModalOpen(false)}
                  variant="outlined"
                  disableRipple
                  sx={{ width: '100%', maxWidth: '200px', fontSize: '1rem', textTransform: 'none', borderRadius: '8px', color: 'white' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disableRipple
                  sx={{ width: '100%', maxWidth: '200px', fontSize: '1rem', textTransform: 'none', borderRadius: '8px' }}
                >
                  Send Message
                </Button>
              </Box>
            </Box>
          </Modal>
        </Box>
      )}
    </>
  );
}

export default CalendarPage;
