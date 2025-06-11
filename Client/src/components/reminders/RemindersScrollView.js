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

/* ────────── constants ────────── */
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

/* ────────── helpers ────────── */
function buildRRule({ freq, byweekday, time, date, monthDay, month, day }) {
  if (freq === 'ONCE') return `ON:${date}T${time}`;

  let r = `RRULE:FREQ=${freq};INTERVAL=1`;
  if (freq === 'WEEKLY' && byweekday.length) r += `;BYDAY=${byweekday.join(',')}`;
  if (freq === 'MONTHLY') r += `;BYMONTHDAY=${monthDay}`;
  if (freq === 'YEARLY') r += `;BYMONTH=${month};BYMONTHDAY=${day}`;
  return `${r};TIME=${time}`;
}

/* ────────── list card ────────── */
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
          <IconButton size="small" onClick={() => onDelete(id)}>
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

/* ────────── main component ────────── */
export default function NotificationsInput() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const today = new Date();

  const [form, setForm] = useState({
    message: '',
    freq: 'ONCE',
    byweekday: [],
    date: todayISO,               // for ONCE
    monthDay: today.getDate(),    // for MONTHLY
    time: '09:00',
    month: today.getMonth() + 1,  // 1–12 for YEARLY
    day: today.getDate(),         // 1–31 for YEARLY
  });

  const [notifications, setNotifications] = useState([]);

  const setField = (name) => (e, v = null) =>
    setForm((f) => ({ ...f, [name]: v ?? e.target.value }));

  const isValid =
    form.message.trim() &&
    (!(form.freq === 'WEEKLY') || form.byweekday.length) &&
    (!(form.freq === 'ONCE') || form.date) &&
    (!(form.freq === 'MONTHLY') || (form.monthDay >= 1 && form.monthDay <= 31)) &&
    (!(form.freq === 'YEARLY') || (form.month >= 1 && form.month <= 12 && form.day >= 1 && form.day <= 31));

  const save = () => {
    if (!isValid) return;
    const rrule = buildRRule(form);
    setNotifications((old) => [...old, { id: Date.now(), ...form, rrule }]);
    setForm({
      message: '',
      freq: 'ONCE',
      byweekday: [],
      date: todayISO,
      monthDay: today.getDate(),
      time: '09:00',
      month: today.getMonth() + 1,
      day: today.getDate(),
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
              <ToggleButton key={f} value={f}>
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
                <ToggleButton key={short} value={short}>
                  {label[0]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}

          {form.freq !== 'ONCE' && (
            <TextField
              label="Time"
              type="time"
              value={form.time}
              onChange={setField('time')}
              fullWidth
            />
          )}

          {form.freq === 'ONCE' && (
            <TextField
              label="Date & time"
              type="datetime-local"
              value={`${form.date}T${form.time}`}
              onChange={(e) => {
                const [d, t] = e.target.value.split('T');
                setForm((f) => ({ ...f, date: d, time: t || f.time }));
              }}
              fullWidth
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
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    month: Math.max(1, Math.min(12, Number(e.target.value))),
                  }))
                }
              />

              <TextField
                label="Day"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="DD"
                value={form.day}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    day: Math.max(1, Math.min(31, Number(e.target.value))),
                  }))
                }
              />

            </Stack>
          )}

          {form.freq === 'MONTHLY' && (
            <TextField
              label="Day of Month"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="MM"
              inputProps={{ min: 1, max: 31 }}
              value={form.monthDay}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  monthDay: Math.max(1, Math.min(31, Number(e.target.value))),
                }))
              }
              fullWidth
            />
          )}

          <Button variant="contained" fullWidth disabled={!isValid} onClick={save}>
            Save
          </Button>
        </Stack>
      </Card>

      <Stack spacing={2} sx={{ mt: 4 }}>
        {notifications.length ? (
          notifications.map((n) => (
            <ReminderCard key={n.id} {...n} onDelete={remove} />
          ))
        ) : (
          <Typography align="center" sx={{ opacity: 0.6 }}>
            **this does not work yet**
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
