import React, { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import EventIcon from '@mui/icons-material/Event';

const ScrollView = () => {
  const theme = useTheme();

  const [items, setItems] = useState(Array.from({ length: 20 }));
  const [hasMore, setHasMore] = useState(true);

  const fetchMoreData = () => {
    setTimeout(() => {
      if (items.length >= 100) {
        setHasMore(false);
        return;
      }
      setItems((prevItems) => [...prevItems, ...Array.from({ length: 20 })]);
    }, 1500);
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        pt: theme.spacing(4),
        pb: theme.spacing(4),
      }}
    >
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
        dataLength={items.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: theme.spacing(2) }}>
            <CircularProgress />
          </Box>
        }
        endMessage={
          <Typography
            variant="body2"
            color={theme.palette.text.secondary}
            align="center"
            sx={{ mt: theme.spacing(2) }}
          >
            You have seen all events.
          </Typography>
        }
        style={{ overflow: 'visible' }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: theme.spacing(3),
          }}
        >
          {items.map((_, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <CardActionArea sx={{ flexGrow: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: theme.spacing(1) }}>
                    <EventIcon sx={{ mr: theme.spacing(1), color: theme.palette.primary.main }} />
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{ fontWeight: 500, color: theme.palette.text.primary }}
                    >
                      New Event
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: theme.spacing(2), color: theme.palette.text.secondary }}
                  >
                    Upcoming Event - #{index + 1}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: theme.palette.text.primary }}
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
