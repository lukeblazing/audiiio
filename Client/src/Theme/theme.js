import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6', // A refined shadcn-style blue (Tailwind blue-500)
    },
    divider: 'rgba(184, 186, 187, 0.69)',
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
    // Override the underlying OutlinedInput used by Select and TextField.
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent', // Ensure the root is transparent
        },
        input: {
          backgroundColor: 'transparent', // Ensure the input area is transparent
        },
        notchedOutline: {
          borderColor: 'rgba(255, 255, 255, 0.8)', // Use your theme.divider if needed
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove uppercase transformation
          fontWeight: 500,
          borderRadius: '8px', // Slightly rounded corners
          padding: '8px 16px',
          fontSize: '16px',
          boxShadow: 'none',
          border: '1px solid #ccc',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          // Use the primary color for hover/active states to mimic shadcn/ui styling
          '&:hover': {
            backgroundColor: '#739BF280',
            borderColor: '#3b82f6',
          },
          '&:active': {
            backgroundColor: '#6E96ED80', // A slightly darker blue for active state
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
          textTransform: 'none', // Remove uppercase transformation
          fontWeight: 500,
          borderRadius: '8px', // Slightly rounded corners
          padding: '8px 16px',
          fontSize: '16px',
          boxShadow: 'none',
          border: '1px solid #ccc',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          // Hover and active states to mimic shadcn/ui styling
          '&:hover': {
            backgroundColor: '#739BF280',
            borderColor: '#3b82f6',
          },
          '&:active': {
            backgroundColor: '#6E96ED80', // A slightly darker blue for active state
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
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
