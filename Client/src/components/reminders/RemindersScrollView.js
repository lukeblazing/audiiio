// NotificationsInput.js
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';

const WEEKDAYS = [
  { short: 'MO', label: 'Mon' },
  { short: 'TU', label: 'Tue' },
  { short: 'WE', label: 'Wed' },
  { short: 'TH', label: 'Thu' },
  { short: 'FR', label: 'Fri' },
  { short: 'SA', label: 'Sat' },
  { short: 'SU', label: 'Sun' },
];

function buildRRule({ freq, byweekday, time }) {
  let r = `RRULE:FREQ=${freq};INTERVAL=1`;
  if (freq === 'WEEKLY' && byweekday.length)
    r += `;BYDAY=${byweekday.join(',')}`;
  return `${r};TIME=${time}`;
}

function GlassCard({ message, time, rrule, onDelete }) {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        overflow: 'hidden',
        borderRadius: 3,
        background: 'background.paper',
        backdropFilter: 'blur(14px) saturate(180%)',
        border: '1.5px solid rgba(255,255,255,0.3)',
        boxShadow: '0 6px 32px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: '0 8px 40px rgba(0,0,0,0.13)' },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <EventIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {message}
          </Typography>
          <IconButton size="small" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.background.paper,
            fontWeight: 500,
            letterSpacing: 0.5,
            mt: 0.5,
          }}
        >
          At {time}
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.6 }}>
          {rrule}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function NotificationsInput() {
  const [form, setForm] = useState({
    message: '',
    freq: 'DAILY',
    byweekday: [],
    time: '09:00',
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msgError, setMsgError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
    if (e.target.name === 'message' && !!msgError) setMsgError('');
  };

  const handleFreqChange = (e) => {
    const freq = e.target.value;
    setForm((f) => ({
      ...f,
      freq,
      byweekday: freq === 'WEEKLY' ? f.byweekday : [],
    }));
  };

  const handleWeekdayChange = (event, newDays) => {
    setForm((f) => ({
      ...f,
      byweekday: newDays,
    }));
  };

  const validateForm = () => {
    if (!form.message.trim()) {
      setMsgError('Message is required');
      return false;
    }
    if (form.freq === 'WEEKLY' && form.byweekday.length === 0) {
      setMsgError('Please select at least one weekday');
      return false;
    }
    setMsgError('');
    return true;
  };

  const addNotification = async () => {
    if (!validateForm()) return;
    const rrule = buildRRule(form);
    const newList = [
      ...notifications,
      {
        id: Date.now(),
        message: form.message,
        time: form.time,
        rrule,
      },
    ];
    setNotifications(newList);
    setForm({
      message: '',
      freq: 'DAILY',
      byweekday: [],
      time: '09:00',
    });
    setLoading(true);
    // send to db
    setLoading(false);
  };

  const deleteNotification = async (id) => {
    const newList = notifications.filter((n) => n.id !== id);
    setNotifications(newList);
    setLoading(true);
    // send to db
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', p: { xs: 2, sm: 4 } }}>
      {/* --- Input form --- */}
      <Card
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 4,
          mb: 4,
          background: 'theme.palette.background.paper',
          boxShadow: '0 3px 16px rgba(0,0,0,0.05)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          New Reminder
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Message"
              name="message"
              required
              fullWidth
              value={form.message}
              onChange={handleChange}
              error={!!msgError}
              helperText={msgError}
              inputProps={{ maxLength: 80 }}
            />
          </Grid>
          <Grid item xs={6} sm={5}>
            <FormControl fullWidth>
              <InputLabel>Repeat</InputLabel>
              <Select
                name="freq"
                value={form.freq}
                label="Repeat"
                onChange={handleFreqChange}
                size="small"
              >
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="YEARLY">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Time"
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              fullWidth
              size="small"
              inputProps={{
                step: 300, // 5 min steps
              }}
            />
          </Grid>
                      {form.freq === 'WEEKLY' && (
              <Grid item xs={12}>
                <Typography sx={{ fontWeight: 500, mb: 0.5 }}>Repeat on</Typography>
                <ToggleButtonGroup
                  value={form.byweekday}
                  onChange={handleWeekdayChange}
                  size="small"
                  aria-label="weekdays"
                  sx={{
                    flexWrap: 'wrap',
                    gap: 0.5,
                    '.MuiToggleButton-root': {
                      minWidth: 38,
                      fontWeight: 600,
                      borderRadius: 2,
                    },
                  }}
                >
                  {WEEKDAYS.map(({ short, label }) => (
                    <ToggleButton key={short} value={short} aria-label={label}>
                      {label[0]}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>
            )}
          <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={addNotification}
              disabled={
                loading ||
                !form.message.trim() ||
                (form.freq === 'WEEKLY' && form.byweekday.length === 0)
              }
              fullWidth
              sx={{ height: 40, borderRadius: 2, fontWeight: 600 }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* --- Notifications list --- */}
      <Box sx={{ display: 'grid', gap: 2 }}>
        {notifications.length === 0 ? (
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ opacity: 0.6, fontWeight: 500 }}
          >
            No reminders yet. Add one above!
          </Typography>
        ) : (
          notifications.map(({ id, message, time, rrule }) => (
            <GlassCard
              key={id}
              message={message}
              time={time}
              rrule={rrule}
              onDelete={() => deleteNotification(id)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
