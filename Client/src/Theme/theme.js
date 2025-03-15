import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    // Globally disable ripple on all ButtonBase components (used by buttons, menu items, etc.)
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#F7F7F7',
          borderRadius: '12px',
          padding: '8px 16px',
          fontSize: '16px',
          border: '1px solid #ccc',
          // Use a subtle hover effect to mimic Apple's refined style
          '&:hover': {
            borderColor: '#007AFF',
          },
          '&:focus': {
            borderColor: '#007AFF',
          },
        },
        icon: {
          color: '#007AFF',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
          // Remove heavy shadows for a flatter, cleaner look
          boxShadow: 'none',
          marginTop: '8px',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiMenuItem: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          fontSize: '16px',
          padding: '8px 16px',
          '&.Mui-selected': {
            backgroundColor: '#E5F1FF',
          },
          '&:hover': {
            backgroundColor: '#F0F0F0',
          },
        },
      },
    },
  },
});

export default theme;
