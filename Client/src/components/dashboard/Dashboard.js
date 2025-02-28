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
  InputLabel
} from '@mui/material';
import MagicWandIcon from '@mui/icons-material/AutoFixHigh';
import AppNavbar from './AppNavbar';
import CalendarPage from '../calendar/CalendarPage';
import SignIn from '../authentication/SignIn';
import { useAuth } from '../authentication/AuthContext';

function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [pressedButton, setPressedButton] = useState(null);

  // Modal open/close states
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Additional state for confirmation modal when deleting an event
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [selectedEventForDelete, setSelectedEventForDelete] = useState(null);

  // State for Remove Event modal: list of events and search query
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // State for Create Event modal: new event form
  const [newEvent, setNewEvent] = useState({
    calendar_id: '',
    category_id: '',
    title: '',
    description: '',
    start: '',
    end_time: '',
    recurrence_rule: ''
  });

  // State for AI modal input
  const [aiInput, setAiInput] = useState('');

  // State for available calendars (for dropdown)
  const [calendars, setCalendars] = useState([]);

  // Predefined category colors with sample names
  const categoryColors = [
    { id: 'red', color: '#f44336', name: 'Urgent' },
    { id: 'blue', color: '#2196f3', name: 'Work' },
    { id: 'green', color: '#4caf50', name: 'Personal' },
    { id: 'purple', color: '#9c27b0', name: 'Fun' },
    { id: 'orange', color: '#ff9800', name: 'Misc' },
  ];

  const commonButtonStyle = {
    width: "100%",
    maxWidth: "200px",
    fontSize: "1rem",
    textTransform: "none",
    borderRadius: "8px",
  };

  if (!isAuthenticated) {
    return <SignIn />;
  }

  // Animate buttons on press
  const handlePress = (button) => {
    setPressedButton(button);
    setTimeout(() => setPressedButton(null), 200);
  };

  // Function to fetch all events for the user (called when remove modal opens)
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/getAllEventsForUser`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    }
  };

  // When remove modal opens, fetch events
  useEffect(() => {
    if (removeModalOpen) {
      fetchEvents();
    }
  }, [removeModalOpen]);

  // Fetch calendars when create modal opens
  const fetchCalendars = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getCalendarsForUser`);
      if (!response.ok) throw new Error('Failed to fetch calendars');
      const data = await response.json();
      setCalendars(data.calendars || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (createModalOpen) {
      fetchCalendars();
    }
  }, [createModalOpen]);

  // Filter events based on the search query (by title or description)
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper function to format a Date object into a "YYYY-MM-DDTHH:mm" string for datetime-local inputs
  const formatDateLocal = (date) => {
    const pad = (num) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Function to actually delete an event (called from the confirmation modal)
  const deleteEvent = async (eventId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/event`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { id: eventId } })
      });
      if (!response.ok) throw new Error('Failed to delete event');
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setConfirmDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error deleting event');
    }
  };

  // Handle Create Event form submission
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    // Validate required fields (calendar, title, and start time are required)
    if (!newEvent.calendar_id || !newEvent.title || !newEvent.start) {
      alert('Please fill in required fields: Calendar, Title, and Start Time.');
      return;
    }
    // If no end time provided, set it to 23:59 on the same day as start
    let endTime = newEvent.end_time;
    if (!endTime) {
      const startDate = new Date(newEvent.start);
      startDate.setHours(23, 59, 0, 0);
      endTime = formatDateLocal(startDate);
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { ...newEvent, end_time: endTime } })
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
        recurrence_rule: ''
      });
      setCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error creating event');
    }
  };

  // Handle AI modal submission
  const handleAiSubmit = (e) => {
    e.preventDefault();
    console.log("AI input:", aiInput);
    setAiInput('');
    setAiModalOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'fixed', width: '100vw' }}>
      <AppNavbar />

      {/* Buttons Container */}
      <Box
        sx={{
          position: 'absolute',
          top: 70,
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
        {/* Remove Event Button */}
        <Button
          variant="outlined"
          sx={{
            width: 100,
            height: 50,
            borderRadius: '12px',
            minWidth: 'auto',
            transition: 'transform 0.2s ease-in-out',
            transform: pressedButton === 'remove' ? 'scale(0.7)' : 'scale(1)',
            backgroundColor: '#fff',
            border: '1px solid',
            fontSize: '2rem',
          }}
          disableRipple
          onMouseDown={() => handlePress('remove')}
          onClick={() => setRemoveModalOpen(true)}
        >
          –
        </Button>

        {/* Add Event Button */}
        <Button
          variant="outlined"
          sx={{
            width: 100,
            height: 50,
            borderRadius: '12px',
            minWidth: 'auto',
            transition: 'transform 0.2s ease-in-out',
            transform: pressedButton === 'add' ? 'scale(0.7)' : 'scale(1)',
            backgroundColor: '#fff',
            border: '1px solid',
            fontSize: '2rem',
          }}
          disableRipple
          onMouseDown={() => handlePress('add')}
          onClick={() => setCreateModalOpen(true)}
        >
          +
        </Button>

        {/* AI Magic Wand Button */}
        <IconButton
          sx={{
            width: 50,
            height: 50,
            borderRadius: '12px',
            minWidth: 'auto',
            border: '2px solid transparent',
            background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, rgb(255, 0, 140), #FF69B4, rgb(247, 0, 255), rgb(245, 89, 245)) border-box',
            color: 'rgb(255, 0, 140)',
            transition: 'transform 0.2s ease-in-out',
            transform: pressedButton === 'ai' ? 'scale(0.7)' : 'scale(1)',
          }}
          disableRipple
          onMouseDown={() => handlePress('ai')}
          onClick={() => setAiModalOpen(true)}
        >
          <MagicWandIcon />
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
          marginTop: '120px',
          maxHeight: '50vh',
          zIndex: 1,
        }}
      >
        <CalendarPage />
      </Box>

      {/* Remove Event Modal */}
      <Modal
        open={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        aria-labelledby="remove-event-modal-title"
        aria-describedby="remove-event-modal-description"
        BackdropProps={{
          sx: { backgroundColor: "rgba(0,0,0,0.5)" },
        }}
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
            border: '1px solid #ccc'
          }}
        >
          <Typography
            id="remove-event-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: "600",
              fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              letterSpacing: "0.5px",
              textAlign: "center",
              width: "100%",
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
          />
          <Box
            id="remove-event-modal-description"
            sx={{
              mt: 2,
              width: "100%",
              maxHeight: "60vh",
              overflowY: "auto",
              padding: "0 8px",
            }}
          >
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <Box
                  key={index}
                  sx={{
                    background: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "8px",
                    cursor: "pointer",
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
              <Typography sx={{ opacity: 0.8, fontSize: "1rem", textAlign: "center" }}>
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

      {/* Confirmation Modal for Deleting an Event */}
      <Modal
        open={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        aria-labelledby="confirm-delete-modal-title"
        aria-describedby="confirm-delete-modal-description"
        BackdropProps={{
          sx: { backgroundColor: "rgba(0,0,0,0.5)" },
        }}
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
            id="confirm-delete-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: "600",
              letterSpacing: "0.5px",
              textAlign: "center",
              width: "100%",
            }}
          >
            Confirm Cancellation
          </Typography>
          {selectedEventForDelete && (
            <Box
              sx={{
                mt: 2,
                width: "100%",
                background: "rgba(0, 0, 0, 0.05)",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "left",
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
              {/* You can add more event details here if desired */}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%', maxWidth: '200px' }}>
            <Button
              onClick={() => setConfirmDeleteModalOpen(false)}
              variant="outlined"
              disableRipple
              sx={commonButtonStyle}
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteEvent(selectedEventForDelete.id)}
              variant="contained"
              disableRipple
              sx={commonButtonStyle}
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
        BackdropProps={{
          sx: { backgroundColor: "rgba(0,0,0,0.5)" },
        }}
      >
        <Box
          component="form"
          onSubmit={handleCreateEvent}
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
            border: '1px solid #ccc'
          }}
        >
          <Typography
            id="create-event-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: "600",
              fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              letterSpacing: "0.5px",
              textAlign: "center",
              width: "100%",
            }}
          >
            New Event!
          </Typography>

          {/* Category Selection with names */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
            {categoryColors.map((cat) => (
              <Box
                key={cat.id}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setNewEvent({ ...newEvent, category_id: cat.id })}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: cat.color,
                    border: newEvent.category_id === cat.id ? '3px solid black' : '2px solid transparent',
                  }}
                />
                <Typography variant="caption" sx={{ mt: 0.5 }}>{cat.name}</Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Dropdown */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="calendar-select-label">Calendar</InputLabel>
            <Select
              labelId="calendar-select-label"
              id="calendar-select"
              value={newEvent.calendar_id}
              label="Calendar"
              onChange={(e) => setNewEvent({ ...newEvent, calendar_id: e.target.value })}
              required
            >
              {calendars.map((cal) => (
                <MenuItem key={cal.id} value={cal.id}>
                  {cal.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Title */}
          <TextField
            label="Title"
            variant="outlined"
            margin="normal"
            fullWidth
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            required
          />

          {/* Description (Single Line) */}
          <TextField
            label="Description"
            variant="outlined"
            margin="normal"
            fullWidth
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />

          {/* Start Time (Required) */}
          <TextField
            label="Start"
            type="datetime-local"
            variant="outlined"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newEvent.start}
            onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
            required
          />

          {/* End Time (Optional) */}
          <TextField
            label="End Time (Optional)"
            type="datetime-local"
            variant="outlined"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newEvent.end_time}
            onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
          />

<Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%', justifyContent: 'center' }}>
  <Button
    onClick={() => setCreateModalOpen(false)}
    variant="outlined"
    disableRipple
    sx={commonButtonStyle}
  >
    Cancel
  </Button>
  <Button
    type="submit"
    variant="contained"
    disableRipple
    sx={commonButtonStyle}
  >
    Create Event
  </Button>
</Box>

        </Box>
      </Modal>

      {/* AI Modal */}
      <Modal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        aria-labelledby="ai-modal-title"
        aria-describedby="ai-modal-description"
        BackdropProps={{
          sx: { backgroundColor: "rgba(0,0,0,0.5)" },
        }}
      >
        <Box
          component="form"
          onSubmit={handleAiSubmit}
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
            border: '1px solid #ccc'
          }}
        >
          <Typography
            id="ai-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: "600",
              fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              letterSpacing: "0.5px",
              textAlign: "center",
              width: "100%",
            }}
          >
            Let us schedule for you!
          </Typography>
          <TextField
            fullWidth
            placeholder="What's up?"
            variant="outlined"
            margin="normal"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
          />
<Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%', justifyContent: 'center' }}>
  <Button
    onClick={() => setAiModalOpen(false)}
    variant="outlined"
    disableRipple
    sx={commonButtonStyle}
  >
    Cancel
  </Button>
  <Button
    type="submit"
    variant="contained"
    disableRipple
    sx={commonButtonStyle}
  >
    Submit
  </Button>
</Box>

        </Box>
      </Modal >
    </Box >
  );
}

export default Dashboard;
