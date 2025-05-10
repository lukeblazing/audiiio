import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // Tailwind blue-500
    },
    background: {
      default: 'transparent', // handled by your HTML/CSS gradient
    },
    text: {
      primary: '#ffffff',     // Main body text
      secondary: '#cbd5e1',   // Tailwind slate-300
      disabled: '#94a3b8',    // Tailwind slate-400
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiModal: {
      defaultProps: {
        disableAutoFocus: true,
        disableEnforceFocus: true,
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'transparent', // match HTML/CSS styling
        },
      },
    },
	  MuiButtonBase: {
            defaultProps: {
                disableRipple: true,
            },
        },
        MuiButtonGroup: {
            defaultProps: {
                disableRipple: true,
            },
        },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          color: '#fff',
          fontWeight: 500,
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: '#334155', // slate-700
          '&:disabled': {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'background.paper', // match darker surface
          color: '#fff',
          borderRadius: '12px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            color: '#fff',
            backgroundColor: '#1e293b',
            borderRadius: '6px',
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'rgba(255,255,255,0.5)',
          },
          '& .MuiFormHelperText-root': {
            color: '#f87171', // red-400
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.23)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#cbd5e1', // slate-300
          '&.Mui-focused': {
            color: '#3b82f6',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          color: '#cbd5e1',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#3b82f6',
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: '#cbd5e1',
        },
      },
    },
  },
});

export default theme;
