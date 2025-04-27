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
import { useTheme } from "@mui/material/styles";

function CalendarPage() {
  const { isAuthenticated, userData } = useAuth();
  const [pressedButton, setPressedButton] = useState(null);
  const theme = useTheme();

  // Modal open/close states
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [calendarSwitcherModalOpen, setCalendarSwitcherModalOpen] = useState(false);
  const [createCalendarModalOpen, setCreateCalendarModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  // Event fetching state: events and loading flag
  const [calendarEvents, setCalendarEvents] = useState([]);

  // State for Create Calendar modal: new calendar form
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    description: '',
  });

  // State for available calendars (for dropdown and filtering)
  const [calendars, setCalendars] = useState([]);
  // State for selected calendars for filtering the events displayed
  const [selectedCalendarFilters, setSelectedCalendarFilters] = useState([]);

  // Animate buttons on press
  const handlePress = (button) => {
    setPressedButton(button);
    setTimeout(() => setPressedButton(null), 200);
  };
  
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

  // Filter calendar events based on the selected calendar filters.
  // If no filters are selected, show all events.
  const filteredCalendarEvents =
    selectedCalendarFilters.length > 0
      ? calendarEvents.filter((event) => selectedCalendarFilters.includes(event.calendar_id))
      : calendarEvents;

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
              selectedCalendars={selectedCalendarFilters}
              setCalendarEvents={setCalendarEvents}
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
                backgroundColor: "transparent",
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
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
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
