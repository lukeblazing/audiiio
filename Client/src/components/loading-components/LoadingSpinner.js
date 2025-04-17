import React from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTheme } from '@mui/material/styles';

// Modern spinner animation
const rotate = keyframes`
  100% {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = ({ open = true, size = 60, thickness = 5, color }) => {
  const theme = useTheme();

  const spinnerColor = color || theme.palette.primary.main;

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.2)',
        zIndex: theme.zIndex.modal,
      }}
    >
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `${thickness}px solid`,
          borderColor: `${spinnerColor} ${spinnerColor} transparent transparent`,
          animation: `${rotate} 0.8s linear infinite`,
        }}
      />
    </Box>
  );
};

export default LoadingSpinner;
