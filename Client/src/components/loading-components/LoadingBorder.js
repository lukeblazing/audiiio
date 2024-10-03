import React from 'react';
import { Box, keyframes } from '@mui/material';

// Define keyframes for horizontal animation (left to right)
const horizontalAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
`;

// Define keyframes for horizontal reverse animation (right to left)
const horizontalReverseAnimation = keyframes`
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Define keyframes for vertical animation (top to bottom)
const verticalAnimation = keyframes`
  0% {
    background-position: 50% 0%;
  }
  100% {
    background-position: 50% 100%;
  }
`;

// Define keyframes for vertical reverse animation (bottom to top)
const verticalReverseAnimation = keyframes`
  0% {
    background-position: 50% 100%;
  }
  100% {
    background-position: 50% 0%;
  }
`;

const LoadingBorder = () => {
  const borderThickness = 12; // Increased thickness of the borders in pixels
  const animationDuration = '8s'; // Slowed down animation for smoothness
  const borderOpacity = 0.6; // Reduced opacity for a softer look

  // Define a soft multicolor gradient with semi-transparency
  const horizontalGradient =
    'linear-gradient(90deg, rgba(255,0,0,0.3), rgba(255,165,0,0.3), rgba(255,255,0,0.3), rgba(0,128,0,0.3), rgba(0,0,255,0.3), rgba(75,0,130,0.3), rgba(238,130,238,0.3))';

  const verticalGradient =
    'linear-gradient(180deg, rgba(255,0,0,0.3), rgba(255,165,0,0.3), rgba(255,255,0,0.3), rgba(0,128,0,0.3), rgba(0,0,255,0.3), rgba(75,0,130,0.3), rgba(238,130,238,0.3))';

  // Check for reduced motion preference for accessibility
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Common styles for animated borders with calmer animations
  const animatedBorderStyle = (gradient, animation) => ({
    position: 'absolute',
    background: gradient,
    backgroundSize: '200% 200%', // Reduced size for more subtle movement
    animation: prefersReducedMotion ? 'none' : `${animation} ${animationDuration} ease-in-out infinite`, // Slowed down animation for smoothness
    opacity: borderOpacity, // Reduced opacity for a softer look
  });

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allows clicks to pass through
        zIndex: 1300, // Ensures the border is on top
      }}
    >
      {/* Top Border */}
      <Box
        sx={{
          ...animatedBorderStyle(horizontalGradient, horizontalAnimation),
          top: 0,
          left: 0,
          width: '100%',
          height: `${borderThickness}px`,
        }}
      />

      {/* Bottom Border */}
      <Box
        sx={{
          ...animatedBorderStyle(horizontalGradient, horizontalReverseAnimation),
          bottom: 0,
          left: 0,
          width: '100%',
          height: `${borderThickness}px`,
        }}
      />

      {/* Left Border */}
      <Box
        sx={{
          ...animatedBorderStyle(verticalGradient, verticalAnimation),
          top: `${borderThickness}px`, // Offset to prevent overlap with top border
          left: 0,
          width: `${borderThickness}px`,
          height: `calc(100% - ${2 * borderThickness}px)`, // Adjust height to prevent overlap with top and bottom borders
        }}
      />

      {/* Right Border */}
      <Box
        sx={{
          ...animatedBorderStyle(verticalGradient, verticalReverseAnimation),
          top: `${borderThickness}px`, // Offset to prevent overlap with top border
          right: 0,
          width: `${borderThickness}px`,
          height: `calc(100% - ${2 * borderThickness}px)`, // Adjust height to prevent overlap with top and bottom borders
        }}
      />
    </Box>
  );
};

export default LoadingBorder;
