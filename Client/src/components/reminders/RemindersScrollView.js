import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';

const FREQUENCIES = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const WEEKDAYS = [
  { short: 'MO', label: 'Mon' },
  { short: 'TU', label: 'Tue' },
  { short: 'WE', label: 'Wed' },
  { short: 'TH', label: 'Thu' },
  { short: 'FR', label: 'Fri' },
  { short: 'SA', label: 'Sat' },
  { short: 'SU', label: 'Sun' },
];

function buildRRule({ freq, byweekday, time, date, monthDay, month, day }) {
  if (freq === 'ONCE') return `ON:${date}T${time}`;
  let r = `RRULE:FREQ=${freq};INTERVAL=1`;
  if (freq === 'WEEKLY' && byweekday.length) r += `;BYDAY=${byweekday.join(',')}`;
  if (freq === 'MONTHLY') r += `;BYMONTHDAY=${monthDay}`;
  if (freq === 'YEARLY') r += `;BYMONTH=${month};BYMONTHDAY=${day}`;
  return `${r};TIME=${time}`;
}

function ReminderCard({ id, message, freq, date, time, monthDay, month, day, onDelete }) {
  const theme = useTheme();
  let whenLine = '';
  if (freq === 'MONTHLY') whenLine = `Every month on day ${monthDay} at ${time}`;
  else if (freq === 'YEARLY') whenLine = `Every year on ${month}/${day} at ${time}`;
  else whenLine = `${date} ${time}`;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        background: 'background.paper',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1}>
          <EventIcon sx={{ color: theme.palette.primary.main }} />
          <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>{message}</Typography>
          <IconButton size="small" onClick={() => onDelete(id)} disableRipple>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {whenLine}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function NotificationsInput() {
  const [form, setForm] = useState({
    message: '',
    freq: 'ONCE',
    byweekday: [],
    date: '',
    monthDay: '',
    time: '09:00',
    month: '',
    day: '',
  });

  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  const setField = (name) => (e, v = null) =>
    setForm((f) => ({ ...f, [name]: v ?? e.target.value }));

  function isValid(form) {
    if (!form.message.trim()) return 'Message is required.';
    if (form.freq === 'WEEKLY' && !form.byweekday.length)
      return 'Please select at least one weekday.';
    if (form.freq === 'ONCE' && !form.date)
      return 'Please select a date for your one-time reminder.';
    if (form.freq === 'MONTHLY') {
      const day = Number(form.monthDay);
      if (!day || day < 1 || day > 31) return 'Monthly day must be between 1 and 31.';
    }
    if (form.freq === 'YEARLY') {
      const month = Number(form.month);
      const day = Number(form.day);
      if (!month || month < 1 || month > 12) return 'Month must be between 1 and 12.';
      if (!day || day < 1 || day > 31) return 'Day must be between 1 and 31.';
    }
    return null;
  }

  const save = () => {
    const validationMessage = isValid(form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError(null);

    const rrule = buildRRule({
      ...form,
      month: Number(form.month),
      day: Number(form.day),
      monthDay: Number(form.monthDay),
    });

    setNotifications((old) => [...old, { id: Date.now(), ...form, rrule }]);
    setForm({
      message: '',
      freq: 'ONCE',
      byweekday: [],
      date: '',
      monthDay: '',
      time: '09:00',
      month: '',
      day: '',
    });
  };

  const remove = (id) => setNotifications((list) => list.filter((n) => n.id !== id));

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', p: 3 }}>
      <Card elevation={0} sx={{ p: 3, borderRadius: 4, boxShadow: '0 3px 12px rgba(0,0,0,0.04)' }}>
        <Stack spacing={2}>
          <TextField
            label="Reminder"
            value={form.message}
            onChange={setField('message')}
            placeholder="e.g. Pay rent"
            inputProps={{ maxLength: 80 }}
            required
            fullWidth
            error={!!error && error.toLowerCase().includes('message')}
          />

          <ToggleButtonGroup
            value={form.freq}
            exclusive
            onChange={setField('freq')}
            size="small"
            sx={{
              width: '100%',
              display: 'flex',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: 0.5,
              '.MuiToggleButton-root': {
                flex: 1,
                minWidth: { xs: '48%', sm: 'auto' },
                textTransform: 'capitalize',
                fontWeight: 500,
                borderRadius: 2,
                px: 1.5,
                transition: 'background-color .15s',
                '&:hover': { bgcolor: 'action.hover' },
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              },
            }}
          >
            {FREQUENCIES.map((f) => (
              <ToggleButton key={f} value={f} disableRipple>
                {f.toLowerCase()}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {form.freq === 'WEEKLY' && (
            <ToggleButtonGroup
              value={form.byweekday}
              onChange={(e, v) => setForm((f) => ({ ...f, byweekday: v }))}
              size="small"
              fullWidth
            >
              {WEEKDAYS.map(({ short, label }) => (
                <ToggleButton key={short} value={short} disableRipple>
                  {label[0]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}

          {form.freq !== 'ONCE' && (
            <TextField
              label="Time"
              type="time"
              sx={{
                flex: 1,
                minWidth: 0,
                '& input[type="time"]': {
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
              value={form.time}
              onChange={setField('time')}
              fullWidth
            />
          )}

          {form.freq === 'ONCE' && (
            <TextField
              label="Date & time"
              type="datetime-local"
              sx={{
                flex: 1,
                minWidth: 0,
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
              value={`${form.date}T${form.time}`}
              onChange={(e) => {
                const [d, t] = e.target.value.split('T');
                setForm((f) => ({ ...f, date: d, time: t || f.time }));
              }}
              fullWidth
              error={!!error && error.toLowerCase().includes('date')}
            />
          )}

          {form.freq === 'YEARLY' && (
            <Stack direction="row" spacing={2}>
              <TextField
                label="Month"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="MM"
                value={form.month}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,2}$/.test(val)) {
                    setForm((f) => ({ ...f, month: val }));
                  }
                }}
                fullWidth
                error={!!error && error.toLowerCase().includes('month')}
              />
              <TextField
                label="Day"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="DD"
                value={form.day}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,2}$/.test(val)) {
                    setForm((f) => ({ ...f, day: val }));
                  }
                }}
                fullWidth
                error={!!error && error.toLowerCase().includes('day')}
              />
            </Stack>
          )}

          {form.freq === 'MONTHLY' && (
            <TextField
              label="Day of Month"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="DD"
              value={form.monthDay}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d{0,2}$/.test(val)) {
                  setForm((f) => ({ ...f, monthDay: val }));
                }
              }}
              fullWidth
              error={!!error && error.toLowerCase().includes('monthly')}
            />
          )}

          <Button variant="contained" fullWidth onClick={save} disableRipple>
            Save
          </Button>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Stack>
      </Card>

      <Stack spacing={2} sx={{ mt: 4 }}>
        {notifications.length ? (
          notifications.map((n) => (
            <ReminderCard key={n.id} {...n} onDelete={remove} />
          ))
        ) : (
          <Typography align="center" sx={{ opacity: 0.6 }}>
            Nothing yet. Add a reminder above.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
