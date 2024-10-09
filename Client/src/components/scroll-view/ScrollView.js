import React, { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  Card,
  CardContent,
  Typography,
  useTheme,
  Container,
  CircularProgress,
  Box,
  CardActionArea,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';

// Function to generate random hex color
const getRandomColor = () => {
  const colors = [
    "#B0BEC5",  // Light Slate Grey
    "#90A4AE",  // Muted Blue Grey
    "#B2DFDB",  // Muted Aqua Green
    "#FFE0B2",  // Soft Peach
    "#CFD8DC"   // Light Cool Grey
  ];
  

  // Randomly select a color from the array
  return colors[Math.floor(Math.random() * colors.length)];
};

const ScrollView = () => {
  // Initialize state with 20 items
  const [items, setItems] = useState(Array.from({ length: 20 }));
  
  // State to manage if more items are available
  const [hasMore, setHasMore] = useState(true);
  
  // Function to fetch more data (placeholder for filler data)
  const fetchMoreData = () => {
    console.log("fetching more data")
    // Simulate a network request
    setTimeout(() => {
      // Example condition to stop fetching more data
      if (items.length >= 100) { // Let's say we have a maximum of 100 items
        setHasMore(false);
        return;
      }
      setItems((prevItems) => [...prevItems, ...Array.from({ length: 20 })]);
    }, 1500);
  };

  // Use theme for consistent styling
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4) }}>
      {/* Header */}
      <Typography
        variant="h4"
        component="h2"
        align="center"
        gutterBottom
        sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
      >
        Coming Up...
      </Typography>

      {/* Infinite Scroll Component */}
      <InfiniteScroll
        dataLength={items.length} // This is the number of items currently loaded
        next={fetchMoreData}      // Function to fetch more data
        hasMore={hasMore}         // Determines if more items should be loaded
        loader={
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: theme.spacing(2) }}>
            <CircularProgress />
          </Box>
        }
        endMessage={
          <Typography
            variant="body2"
            color={theme.palette.text.secondary}
            align="center"
            sx={{ marginTop: theme.spacing(2) }}
          >
            You have seen all events.
          </Typography>
        }
        style={{ overflow: 'visible' }}  // Prevent the inner scrollbar
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr',
            },
            gap: theme.spacing(3),
          }}
        >
          {items.map((_, index) => (
            <Card
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                backgroundColor: getRandomColor(),  // Assign random background color to each event
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[6],
                },
              }}
              key={index}
            >
              <CardActionArea sx={{ flexGrow: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing(1) }}>
                    <EventIcon color="primary" sx={{ marginRight: theme.spacing(1) }} />
                    <Typography
                      variant="h6"
                      component="div"
                      color={theme.palette.text.primary}
                      sx={{ fontWeight: 'medium' }}
                    >
                      New Event
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color={theme.palette.text.secondary}
                    sx={{ marginBottom: theme.spacing(2) }}
                  >
                    Upcoming Event - #{index + 1}
                  </Typography>
                  <Typography
                    variant="body1"
                    color={theme.palette.text.primary}
                  >
                    This is the description for the event.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </InfiniteScroll>
    </Container>
  );
};

export default ScrollView;
