import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from '@mui/material';

const LoadingBorder = () => {
  const borderThickness = 4; // Thickness of the borders in pixels

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Allows clicks to pass through
        zIndex: 1300, // Ensures the border is on top
      }}
    >
      {/* Top Border */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${borderThickness}px`,
        }}
      >
        <LinearProgress color="primary" />
      </Box>

      {/* Bottom Border */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: `${borderThickness}px`,
        }}
      >
        <LinearProgress color="secondary" />
      </Box>

      {/* Left Border */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${borderThickness}px`,
          height: '100%',
          transform: 'rotate(180deg)', // Rotate to make it vertical
        }}
      >
        <LinearProgress color="primary" />
      </Box>

      {/* Right Border */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: `${borderThickness}px`,
          height: '100%',
          transform: 'rotate(180deg)', // Rotate to make it vertical
        }}
      >
        <LinearProgress color="secondary" />
      </Box>
    </Box>
  );
};

export default LoadingBorder;
