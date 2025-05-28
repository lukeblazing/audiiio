// OpenMeteoForecast.jsx
import React from 'react';
import {
  Box, Chip, CircularProgress, Divider, IconButton,
  Stack, Typography, useTheme, styled
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format, isWithinInterval, set } from 'date-fns';

const WEATHER = {
  0: ['☀️', 'Clear sky'],
  1: ['🌤️', 'Mainly clear'],
  2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'],
  48: ['🌫️', 'Dense fog'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Moderate drizzle'],
  55: ['🌦️', 'Dense drizzle'],
  56: ['🌧️', 'Light freezing drizzle'],
  57: ['🌧️', 'Dense freezing drizzle'],
  61: ['🌧️', 'Slight rain'],
  63: ['🌧️', 'Moderate rain'],
  65: ['🌧️', 'Heavy rain'],
  66: ['🌧️', 'Light freezing rain'],
  67: ['🌧️', 'Heavy freezing rain'],
  71: ['🌨️', 'Slight snow fall'],
  73: ['🌨️', 'Moderate snow fall'],
  75: ['🌨️', 'Heavy snow fall'],
  77: ['❄️', 'Snow storm'],
  80: ['🌧️', 'Slight rain showers'],
  81: ['🌧️', 'Moderate rain showers'],
  82: ['🌧️', 'Violent rain showers'],
  85: ['🌨️', 'Slight snow showers'],
  86: ['🌨️', 'Heavy snow showers'],
  95: ['⛈️', 'Thunderstorm'],
  96: ['⛈️', 'Thunderstorm with slight hail'],
  99: ['⛈️', 'Thunderstorm with heavy hail'],
};

const getEmoji = (c) => WEATHER[c]?.[0];
const getDesc = (c) => WEATHER[c]?.[1] ?? 'Unknown';
const getPrecipType = (c) => {
  if ([71, 73, 75, 77, 85, 86].includes(c)) return 'Snow';
  if ([56, 57, 66, 67].includes(c)) return 'Freezing rain';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(c)) return 'Rain';
  if ([95, 96, 99].includes(c)) return 'Thunderstorm';
  return 'None';
};

function useWeather(date) {
  const [state, setState] = React.useState({
    data: null,
    isLoading: true,
    isError: false,
  });

  React.useEffect(() => {
    let ignore = false;
    const fetchWeather = async () => {
      setState(s => ({ ...s, isLoading: true }));
      try {
        const day = format(
          new Date(date.getTime() + 86400000),
          'yyyy-MM-dd',
        );
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/weather?date=${day}`,
          { credentials: 'include' },
        );
        const json = await res.json();
        if (!ignore) {
          setState({
            data: {
              weather: json.weather ?? null,
              hourly: json.hourly ?? null,
            },
            isLoading: false,
            isError: false,
          });
        }
      } catch {
        if (!ignore) setState({ data: null, isLoading: false, isError: true });
      }
    };
    fetchWeather();
    return () => { ignore = true; };
  }, [date]);

  return state;
}

export default function OpenMeteoForecast({ date, onClose }) {
  const theme = useTheme();
  const { data, isLoading, isError } = useWeather(date);

  if (isLoading) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fce38a 0%, #f38181 50%, #a18cd1 100%)',
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading weather…</Typography>
      </Box>
    );
  }


  if (isError || !data?.weather) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Typography>Weather unavailable.</Typography>
      </Box>
    );
  }

  const daylightHours = data.hourly?.time
    ?.map((t, i) => ({
      t,
      temp: Math.round(data.hourly.temp[i]),
      precip: data.hourly.precip[i],
    }))
    ?.filter((h) =>
      isWithinInterval(new Date(h.t), {
        start: set(new Date(h.t), { hours: 5, minutes: 0, seconds: 0 }),
        end: set(new Date(h.t), { hours: 22, minutes: 0, seconds: 0 }),
      })
    ) ?? [];

  return (
    <Box
      component="section"
      sx={{
        width: '90vw',
        height: '40vh',
        mx: 'auto',
        px: 2,
        py: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        background: 'linear-gradient(135deg,rgba(252, 227, 138, 0.72) 0%,rgba(243, 129, 129, 0.42) 50%,rgba(161, 140, 209, 0.4) 100%)',
        borderRadius: 4,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
        }}
      >
        <Typography
          component="h2"
          sx={{
            flex: 1,
            textAlign: 'center',
            fontWeight: 600,
            letterSpacing: 1.1,
            fontSize: 'clamp(1.2rem, 5vw, 1.6rem)',
          }}
        >
          {format(new Date(data.weather.date), 'eeee, MMM d')}
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} aria-label="close forecast">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Stack spacing={2} alignItems="center">
        <Typography
          component="div"
          sx={{ fontSize: 'clamp(4rem, 28vw, 6rem)', lineHeight: 1 }}
        >
          {getEmoji(data.weather.weathercode) || getDesc(data.weather.weathercode)}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 500, textAlign: 'center' }}>
          {getDesc(data.weather.weathercode)}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`High ${Math.round(data.weather.temp_max)}°`} color="error" />
          <Chip label={`Low ${Math.round(data.weather.temp_min)}°`} color="info" />
        </Stack>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Precip&nbsp;
          <strong>{data.weather.precip}"</strong>&nbsp;•{' '}
          {getPrecipType(data.weather.weathercode)}
        </Typography>
      </Stack>
    </Box>
  );
}
