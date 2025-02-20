import React from 'react';
import {
  Box,
  IconButton,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

const CalendarToolbar = ({ date, view, onNavigate, onView, localizer }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const goToBack = () => onNavigate('PREV');
  const goToNext = () => onNavigate('NEXT');
  const goToToday = () => onNavigate('TODAY');

  const label = () => localizer.format(date, 'MMMM yyyy');

  // Updated icon button style for a rounded rectangular hitbox
  const iconButtonStyle = {
    padding: '10px',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
  };

  const todayButtonStyle = {
    padding: '6px 12px',
    textTransform: 'none',
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
  };

  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      padding={1}
      bgcolor="white"
      border="2px solid"
      borderColor={theme.palette.divider}
      borderRadius="8px 8px 0 0"
      borderBottom="none"
      flexWrap="nowrap"
    >
      {/* Left: Back Button */}
      <IconButton
        onClick={goToBack}
        aria-label="Previous"
        size="medium"
        sx={{ ...iconButtonStyle, marginLeft: '16px' }}
      >
        <ArrowBack sx={{ color: theme.palette.primary.main, fontSize: '1.5rem' }} />
      </IconButton>

      {/* Center: Header and Today Button */}
      <Box display="flex" flexDirection="column" alignItems="center" flexGrow={1}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            textAlign: 'center',
            fontSize: '1.5rem',
            fontFamily: 'cursive',
          }}
        >
          {label()}
        </Typography>
        <Button
          onClick={goToToday}
          variant="text"
          size="small"
          sx={{ ...todayButtonStyle, marginTop: '8px' }}
        >
          Today
        </Button>
      </Box>

      {/* Right: Next Button */}
      <IconButton
        onClick={goToNext}
        aria-label="Next"
        size={isSmallScreen ? 'small' : 'medium'}
        sx={{ ...iconButtonStyle, marginRight: '16px' }}
      >
        <ArrowForward sx={{ color: theme.palette.primary.main, fontSize: '1.5rem' }} />
      </IconButton>
    </Box>
  );
};

export default CalendarToolbar;
