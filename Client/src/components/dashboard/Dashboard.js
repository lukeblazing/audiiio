import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton, Checkbox, FormControlLabel } from '@mui/material';
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
    all_day: false,
    recurrence_rule: ''
  });

  // State for AI modal input
  const [aiInput, setAiInput] = useState('');

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

  // Filter events based on the search query (by title or description)
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle deleting an event after user confirms
  const handleDeleteEvent = async (eventId) => {
    const confirmed = window.confirm('Are you sure you want to delete this event?');
    if (!confirmed) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/event`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { id: eventId } })
      });
      if (!response.ok) throw new Error('Failed to delete event');
      // Remove the deleted event from the list
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      console.error(err);
      alert('Error deleting event');
    }
  };

  // Handle Create Event form submission
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!newEvent.calendar_id || !newEvent.title || !newEvent.start || !newEvent.end_time) {
      alert('Please fill in required fields: Calendar ID, Title, Start, and End Time.');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/calendar/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: newEvent })
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
        all_day: false,
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
        {/* Remove Event Button */}
        <Button 
          variant="outlined" 
          color="error"
          sx={{ 
            width: 150, 
            height: 50, 
            borderRadius: '12px', 
            minWidth: 'auto',
            transition: 'transform 0.2s ease-in-out',
            transform: pressedButton === 'remove' ? 'scale(0.7)' : 'scale(1)',
          }}
          disableRipple
          onMouseDown={() => handlePress('remove')}
          onClick={() => setRemoveModalOpen(true)}
        >
          Remove Event
        </Button>

        {/* Add Event Button */}
        <Button 
          variant="outlined" 
          color="primary" 
          sx={{ 
            width: 150, 
            height: 50, 
            borderRadius: '12px', 
            minWidth: 'auto',
            transition: 'transform 0.2s ease-in-out',
            transform: pressedButton === 'add' ? 'scale(0.7)' : 'scale(1)',
          }}
          disableRipple
          onMouseDown={() => handlePress('add')}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Event
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
          }}
        >
          <Typography
            id="remove-event-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: "600",
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
                  onClick={() => handleDeleteEvent(event.id)}
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
          }}
        >
          <Typography
            id="create-event-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: "600",
              letterSpacing: "0.5px",
              textAlign: "center",
              width: "100%",
            }}
          >
            Create Event
          </Typography>
          <TextField
            label="Calendar ID"
            variant="outlined"
            margin="normal"
            fullWidth
            value={newEvent.calendar_id}
            onChange={(e) => setNewEvent({ ...newEvent, calendar_id: e.target.value })}
            required
          />
          <TextField
            label="Category ID"
            variant="outlined"
            margin="normal"
            fullWidth
            value={newEvent.category_id}
            onChange={(e) => setNewEvent({ ...newEvent, category_id: e.target.value })}
          />
          <TextField
            label="Title"
            variant="outlined"
            margin="normal"
            fullWidth
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            required
          />
          <TextField
            label="Description"
            variant="outlined"
            margin="normal"
            fullWidth
            multiline
            rows={3}
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />
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
          <TextField
            label="End Time"
            type="datetime-local"
            variant="outlined"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newEvent.end_time}
            onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newEvent.all_day}
                onChange={(e) => setNewEvent({ ...newEvent, all_day: e.target.checked })}
              />
            }
            label="All Day Event"
          />
          <TextField
            label="Recurrence Rule"
            variant="outlined"
            margin="normal"
            fullWidth
            value={newEvent.recurrence_rule}
            onChange={(e) => setNewEvent({ ...newEvent, recurrence_rule: e.target.value })}
          />
          <Button
            type="submit"
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
            Create Event
          </Button>
          <Button
            onClick={() => setCreateModalOpen(false)}
            variant="outlined"
            sx={{
              mt: 1,
              width: "100%",
              maxWidth: "200px",
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Cancel
          </Button>
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
          }}
        >
          <Typography
            id="ai-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: "600",
              letterSpacing: "0.5px",
              textAlign: "center",
              width: "100%",
            }}
          >
            AI Magic Wand
          </Typography>
          <TextField
            fullWidth
            placeholder="What's up?"
            variant="outlined"
            margin="normal"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
          />
          <Button
            type="submit"
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
            Submit
          </Button>
          <Button
            onClick={() => setAiModalOpen(false)}
            variant="outlined"
            sx={{
              mt: 1,
              width: "100%",
              maxWidth: "200px",
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Cancel
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}

export default Dashboard;
