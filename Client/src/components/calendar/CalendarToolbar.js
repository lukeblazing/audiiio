// CalendarToolbar.js
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

    // Navigation Handlers
    const goToBack = () => {
        onNavigate('PREV');
    };

    const goToNext = () => {
        onNavigate('NEXT');
    };

    const goToToday = () => {
        onNavigate('TODAY');
    };

    // View Change Handler
    const handleViewChange = (newView) => {
        onView(newView);
    };

    // Label Formatter
    const label = () => {
        return localizer.format(date, 'MMMM yyyy');
    };

    return (
        <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            padding={1}
            bgcolor="background.paper"
            borderBottom={1}
            borderColor="divider"
            flexWrap="nowrap" // Prevent wrapping to maintain single row
        >
            {/* Left: Back Button */}
            <Box>
                <IconButton
                    onClick={goToBack}
                    color="inherit"
                    aria-label="Previous"
                    size={'small'}
                    sx={{
                        padding: '6px',
                        boxShadow: 'none',
                        border: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                        },
                    }}
                >
                    <ArrowBack />
                </IconButton>
            </Box>

            {/* Center: Today Button and Label */}
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                flexGrow={1}
            >
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontFamily: theme.typography.fontFamily,
                    }}
                >
                    {label()}
                </Typography>
                <Button
                    onClick={goToToday}
                    color="primary"
                    aria-label="Today"
                    size={'small'}
                    variant="text"
                    disableElevation
                    sx={{
                        textTransform: 'none',
                        padding: '4px 8px',
                        boxShadow: 'none',
                        border: 'none',
                        outline: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            boxShadow: 'none',
                            border: 'none',
                        },
                        '&:focus': {
                            outline: 'none',
                            boxShadow: 'none',
                            border: 'none',
                        },
                        '&:active': {
                            boxShadow: 'none',
                            border: 'none',
                        },
                        fontFamily: theme.typography.fontFamily,
                        fontSize: '0.875rem',
                        marginBottom: 0.5, // Space between button and label
                    }}
                >
                    Today
                </Button>
            </Box>

            {/* Right: Next Button */}
            <Box>
                <IconButton
                    onClick={goToNext}
                    color="inherit"
                    aria-label="Next"
                    size={isSmallScreen ? 'small' : 'medium'}
                    sx={{
                        padding: isSmallScreen ? '6px' : '8px',
                        boxShadow: 'none',
                        border: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                        },
                    }}
                >
                    <ArrowForward />
                </IconButton>
            </Box>
        </Box>
    );
};

// Export the component
export default CalendarToolbar;
