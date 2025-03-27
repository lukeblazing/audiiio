import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6', // A refined shadcn-style blue (Tailwind blue-500)
    },
    divider: 'rgba(184, 186, 187, 0.69)',
    text: {
      primary: '#fff', // Set default text color to white
    },
  },
  components: {
    // Globally disable ripple on all ButtonBase components (used by buttons, menu items, etc.)
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          backgroundColor: 'transparent', // Remove the default white background
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '16px',
          boxShadow: 'none',
          border: '1px solid #ccc',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            backgroundColor: '#739BF280',
            borderColor: '#3b82f6',
          },
          '&:active': {
            backgroundColor: '#6E96ED80',
          },
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '16px',
          boxShadow: 'none',
          border: '1px solid #ccc',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            backgroundColor: '#739BF280',
            borderColor: '#3b82f6',
          },
          '&:active': {
            backgroundColor: '#6E96ED80',
          },
        },
      },
    },
    // Override default icon styles
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: '#fff', // Set icons to white. Change to '#f3f3f3' for a light gray shade if preferred.
        },
      },
    },
  },
});

export default theme;
