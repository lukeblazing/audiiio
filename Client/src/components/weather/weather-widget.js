/**
 * Open-Meteo “Wide” forecast card – **JavaScript version**
 * --------------------------------------------------------
 * • Same data-fetch logic as before
 * • No TypeScript syntax
 * • 100 % width + mobile-safe paddings so nothing overflows
 * • Emoji/description table guarantees a glyph for every code
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    Box,
    Typography,
    Divider,
    CircularProgress,
    Chip,
    Fade,
    Grid,
    Tooltip,
    Stack,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';


/* ----------------- weather metadata (emoji + text) ----------------- */

const weatherMeta = {
    0: { emoji: '☀️', desc: 'Clear sky' },
    1: { emoji: '🌤️', desc: 'Mainly clear' },
    2: { emoji: '⛅', desc: 'Partly cloudy' },
    3: { emoji: '☁️', desc: 'Overcast' },
    45: { emoji: '🌫️', desc: 'Foggy' },
    48: { emoji: '🌫️', desc: 'Rime fog' },
    51: { emoji: '🌦️', desc: 'Light drizzle' },
    53: { emoji: '🌦️', desc: 'Drizzle' },
    55: { emoji: '🌧️', desc: 'Dense drizzle' },
    56: { emoji: '🧊🌦️', desc: 'Freezing drizzle' },
    57: { emoji: '🧊🌧️', desc: 'Freezing drizzle' },
    61: { emoji: '🌦️', desc: 'Slight rain' },
    63: { emoji: '🌧️', desc: 'Rain' },
    65: { emoji: '🌧️', desc: 'Heavy rain' },
    66: { emoji: '🧊🌧️', desc: 'Freezing rain' },
    67: { emoji: '🧊🌧️', desc: 'Heavy freezing rain' },
    71: { emoji: '🌨️', desc: 'Slight snowfall' },
    73: { emoji: '🌨️', desc: 'Snowfall' },
    75: { emoji: '🌨️', desc: 'Heavy snowfall' },
    77: { emoji: '🌨️', desc: 'Snow grains' },
    80: { emoji: '🌧️', desc: 'Rain showers' },
    81: { emoji: '🌧️', desc: 'Rain showers' },
    82: { emoji: '🌧️', desc: 'Heavy rain showers' },
    85: { emoji: '🌨️', desc: 'Snow showers' },
    86: { emoji: '🌨️', desc: 'Heavy snow showers' },
    95: { emoji: '⛈️', desc: 'Thunderstorm' },
    96: { emoji: '⛈️', desc: 'Thunderstorm + hail' },
    99: { emoji: '⛈️', desc: 'Heavy thunderstorm + hail' },
};

const getEmoji = code => (weatherMeta[code] ? weatherMeta[code].emoji : '❔');
const getDesc = code => (weatherMeta[code] ? weatherMeta[code].desc : 'Unknown');

/* --------------------------- helpers --------------------------- */

const getPrecipType = code => {
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
    if ([56, 57, 66, 67].includes(code)) return 'Freezing rain';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Rain';
    if ([95, 96, 99].includes(code)) return 'Thunderstorm';
    return 'None';
};

/* ------------------ lightweight column-chart ------------------ */

function MiniChart({ values, color = '#90caf9', height = 60, unit = '', minBarHeight = 3 }) {
    if (!values?.length) return null;
    const max = Math.max(...values.map(v => v.value));
    const min = Math.min(...values.map(v => v.value));
    const norm = v => (min === max ? 0.5 : (v - min) / (max - min));

    return (
        <Box sx={{ height, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
            {values.map(v => (
                <Tooltip key={v.time} title={`${format(new Date(v.time), 'haaa')}: ${v.value}${unit}`} arrow>
                    <Box
                        sx={{
                            flex: 1,
                            height: `${norm(v.value) * (height - minBarHeight) + minBarHeight}px`,
                            borderRadius: 1,
                            bgcolor: color,
                            transition: 'height .2s',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                        }}
                    />
                </Tooltip>
            ))}
        </Box>
    );
}

/* -------------------------- component -------------------------- */

export default function OpenMeteoForecast({ date, onClose }) {
    const theme = useTheme();
    const [weather, setWeather] = useState(null);
    const [hourly, setHourly] = useState(null);
    const [loading, setLoading] = useState(true);

    /* ---- 2.  Fetch forecast from backend ---- */
    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            const day = format(new Date(date.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/weather?date=${day}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) {
                    console.error('Failed to fetch weather:', res.status);
                    setWeather(null);
                    setHourly(null);
                    return;
                }

                const data = await res.json();
                setWeather(data.weather || null);
                setHourly(data.hourly || null);
            } catch (error) {
                console.error('Weather fetch error:', error);
                setWeather(null);
                setHourly(null);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [date]);

    /* ---- 3.  early returns ---- */
    if (loading)
        return (
            <Box sx={{ p: 6, textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Loading weather…</Typography>
            </Box>
        );

    if (!weather)
        return (
            <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>Weather unavailable.</Typography>
            </Box>
        );

    /* ---- 4.  derived values ---- */
    const precipType = getPrecipType(weather.weathercode);
    const hours = (hourly?.time || []).map((t, i) => ({
        time: t,
        temp: Math.round(hourly.temp[i]),
        precip: hourly.precip[i],
        code: hourly.wcode[i],
    }));

    /* ---- 5.  render ---- */
    return (
        <Fade in>
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 900,
                    overflow: 'clip',
                    py: { xs: 3, sm: 4, md: 5 },
                    mx: 'auto',
                    px: { xs: 2, sm: 3, md: 4 },
                    boxSizing: 'border-box',
                    borderRadius: 4,
                    background: 'linear-gradient(130deg,#1e2027 0%,#31343b 100%)',
                    color: 'common.white',
                    boxShadow: 10,
                }}
            >
                {onClose && (
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: 'white',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}

                <Stack spacing={1} alignItems="center" sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Typography variant="h4" sx={{ letterSpacing: 2, fontSize: { xs: 22, sm: 30 } }}>
                        {format(new Date(weather.date), 'eeee, MMM d')}
                    </Typography>
                    <Divider flexItem sx={{ my: 1, borderColor: 'rgba(255,255,255,.15)' }} />
                </Stack>

                <Grid
                    container
                    spacing={{ xs: 2, sm: 4 }}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ mt: 1, overflowX: 'hidden' }}
                >
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                        <Box component="span" sx={{ fontSize: { xs: '22vw', sm: 96, md: 120 }, lineHeight: 1 }}>
                            {getEmoji(weather.weathercode)}
                        </Box>
                        <Typography variant="h5" sx={{ mt: 1 }}>
                            {getDesc(weather.weathercode)}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={5}>
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Chip label={`High ${Math.round(weather.temp_max)}°F`} color="error" sx={{ fontSize: 16 }} />
                                <Chip label={`Low ${Math.round(weather.temp_min)}°F`} color="info" sx={{ fontSize: 16 }} />
                            </Stack>
                            <Typography sx={{ textAlign: 'center', opacity: 0.9 }}>
                                Precip&nbsp;<strong>{weather.precip}"</strong> • <strong>{precipType}</strong>
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>

                {hours.length > 0 && (
                    <>
                        <Divider sx={{ my: { xs: 3, md: 4 }, borderColor: 'rgba(255,255,255,.15)' }} />

                        <Grid container spacing={{ xs: 2, md: 4 }}>
                            <Grid item xs={12} md={7}>
                                <Typography sx={{ mb: 1, opacity: 0.8 }}>Temperature (°F)</Typography>
                                <MiniChart
                                    values={hours.map(h => ({ time: h.time, value: h.temp }))}
                                    height={80}
                                    color={theme.palette.primary.light}
                                    unit="°F"
                                />
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <Typography sx={{ mb: 1, opacity: 0.8 }}>Precipitation (in)</Typography>
                                <MiniChart
                                    values={hours.map(h => ({ time: h.time, value: h.precip }))}
                                    height={80}
                                    color={theme.palette.info.light}
                                    minBarHeight={2}
                                    unit="in"
                                />
                            </Grid>
                        </Grid>
                    </>
                )}
            </Box>
        </Fade>
    );
}

