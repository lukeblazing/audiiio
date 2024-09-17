import { createTheme, alpha } from '@mui/material/styles';

const defaultTheme = createTheme();

const customShadows = [...defaultTheme.shadows];

export const brand = {
  50: 'hsl(45, 100%, 97%)',   // Lightest Yellow
  100: 'hsl(45, 96%, 90%)',   // Soft Yellow for backgrounds
  200: 'hsl(45, 92%, 80%)',   // Accent Yellow
  300: 'hsl(45, 88%, 65%)',   // Main Button Yellow
  400: '#FFDD57',             // Primary Brand Yellow
  500: 'hsl(45, 84%, 50%)',   // Deeper Yellow
  600: 'hsl(45, 70%, 35%)',   // Hover or Darker Variant
  700: 'hsl(45, 60%, 25%)',   // For dark mode or accents
  800: 'hsl(45, 55%, 20%)',
  900: 'hsl(45, 50%, 15%)',
};

export const green = {
  50: 'hsl(120, 100%, 95%)',
  100: 'hsl(120, 85%, 92%)',
  200: 'hsl(120, 75%, 80%)',
  300: 'hsl(120, 70%, 65%)',
  400: 'hsl(120, 65%, 50%)', // Success green
  500: 'hsl(120, 70%, 40%)',
  600: 'hsl(120, 75%, 30%)',
  700: 'hsl(120, 80%, 20%)',
  800: 'hsl(120, 90%, 10%)',
  900: 'hsl(120, 95%, 5%)',
};

export const orange = {
  50: 'hsl(45, 100%, 97%)',
  100: 'hsl(45, 92%, 90%)',
  200: 'hsl(45, 94%, 80%)',
  300: 'hsl(45, 90%, 65%)',
  400: 'hsl(45, 90%, 40%)',
  500: 'hsl(45, 90%, 35%)',
  600: 'hsl(45, 91%, 25%)',
  700: 'hsl(45, 94%, 20%)',
  800: 'hsl(45, 95%, 16%)',
  900: 'hsl(45, 93%, 12%)',
};

export const red = {
  50: 'hsl(0, 100%, 97%)',
  100: 'hsl(0, 92%, 90%)',
  200: 'hsl(0, 94%, 80%)',
  300: 'hsl(0, 90%, 65%)',
  400: 'hsl(0, 90%, 40%)',
  500: 'hsl(0, 90%, 30%)',
  600: 'hsl(0, 91%, 25%)',
  700: 'hsl(0, 94%, 18%)',
  800: 'hsl(0, 95%, 12%)',
  900: 'hsl(0, 93%, 6%)',
};

export const gray = {
  50: 'hsl(210, 10%, 95%)',  // Very light gray (almost white)
  100: 'hsl(210, 10%, 92%)', // Light gray
  200: 'hsl(210, 10%, 80%)', // Mid gray for borders/backgrounds
  300: 'hsl(210, 8%, 65%)',  // Neutral for secondary text
  400: 'hsl(210, 6%, 48%)',  // Medium gray
  500: 'hsl(210, 6%, 35%)',  // Standard gray for text
  600: 'hsl(210, 8%, 25%)',  // Darker gray
  700: 'hsl(210, 10%, 15%)', // Dark gray for primary text (dark mode)
  800: 'hsl(210, 10%, 10%)', // Very dark gray
  900: 'hsl(210, 12%, 7%)',  // Almost black
};

export const blue = {
  50: 'hsl(220, 100%, 95%)',
  100: 'hsl(220, 85%, 92%)',
  200: 'hsl(220, 70%, 80%)',
  300: 'hsl(220, 70%, 65%)',
  400: 'hsl(220, 65%, 50%)', // Primary accent blue
  500: 'hsl(220, 70%, 40%)', // Darker blue
  600: 'hsl(220, 80%, 35%)',
  700: 'hsl(220, 90%, 25%)',
  800: 'hsl(220, 90%, 15%)',
  900: 'hsl(220, 95%, 10%)',
};


export const getDesignTokens = (mode) => {
  customShadows[1] =
    mode === 'dark'
      ? 'hsla(210, 10%, 15%, 0.7) 0px 4px 16px 0px, hsla(210, 10%, 10%, 0.8) 0px 8px 16px -5px'
      : 'hsla(210, 10%, 15%, 0.07) 0px 4px 16px 0px, hsla(210, 10%, 10%, 0.07) 0px 8px 16px -5px';

  return {
    palette: {
      mode,
      primary: {
        light: '#63a4ff',     // Lighter blue
        main: '#1976d2',      // Material UI default blue (professional blue)
        dark: '#004ba0',      // Darker blue
        contrastText: '#ffffff', // Ensure contrast text is white
        ...(mode === 'dark' && {
          contrastText: '#ffffff',
          light: '#63a4ff',
          main: '#1976d2',
          dark: '#004ba0',
        }),
      },
      secondary: {
        main: blue[400],     // Secondary blue accent
        contrastText: gray[50],
      },
      success: {
        light: green[300],
        main: green[400],
        dark: green[800],
        ...(mode === 'dark' && {
          light: green[400],
          main: green[500],
          dark: green[700],
        }),
      },
      grey: gray,
      divider: mode === 'dark' ? alpha(gray[700], 0.6) : alpha(gray[300], 0.4),
      background: {
        default: 'hsl(0, 0%, 99%)',
        paper: 'hsl(210, 35%, 97%)',
        ...(mode === 'dark' && { default: gray[900], paper: gray[800] }),
      },
      text: {
        primary: gray[800],
        secondary: gray[600],
        ...(mode === 'dark' && {
          primary: gray[50],
          secondary: gray[400],
        }),
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: alpha(gray[200], 0.3),
        ...(mode === 'dark' && {
          hover: alpha(gray[600], 0.2),
          selected: alpha(gray[600], 0.3),
        }),
      },
    },
    typography: {
      fontFamily: ['"Inter", "sans-serif"'].join(','),
      h1: {
        fontSize: defaultTheme.typography.pxToRem(48),
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: defaultTheme.typography.pxToRem(36),
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h3: {
        fontSize: defaultTheme.typography.pxToRem(30),
        lineHeight: 1.2,
      },
      h4: {
        fontSize: defaultTheme.typography.pxToRem(24),
        fontWeight: 600,
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: customShadows,
  };
};

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: '#63a4ff',     // A lighter blue
        main: '#1976d2',      // Professional, designer blue
        dark: '#004ba0',      // A darker blue shade
        contrastText: brand[50],
      },
      info: {
        light: brand[100],
        main: brand[300],
        dark: brand[600],
        contrastText: gray[50],
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[800],
      },
      error: {
        light: red[300],
        main: red[400],
        dark: red[800],
      },
      success: {
        light: green[300],
        main: green[400],
        dark: green[800],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[300], 0.4),
      background: {
        default: 'hsl(0, 0%, 99%)',
        paper: 'hsl(220, 35%, 97%)',
      },
      text: {
        primary: gray[800],
        secondary: gray[600],
        warning: orange[400],
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: `${alpha(gray[200], 0.3)}`,
      },
      baseShadow:
        'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
    },
  },
  dark: {
    palette: {
      primary: {
        contrastText: brand[50],
        light: '#63a4ff',
        main: '#1976d2',
        dark: '#004ba0',
      },
      info: {
        contrastText: brand[300],
        light: brand[500],
        main: brand[700],
        dark: brand[900],
      },
      warning: {
        light: orange[400],
        main: orange[500],
        dark: orange[700],
      },
      error: {
        light: red[400],
        main: red[500],
        dark: red[700],
      },
      success: {
        light: green[400],
        main: green[500],
        dark: green[700],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[700], 0.6),
      background: {
        default: gray[900],
        paper: 'hsl(220, 30%, 7%)',
      },
      text: {
        primary: 'hsl(0, 0%, 100%)',
        secondary: gray[400],
      },
      action: {
        hover: alpha(gray[600], 0.2),
        selected: alpha(gray[600], 0.3),
      },
      baseShadow:
        'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px',
    },
  },
};

export const typography = {
  fontFamily: ['"Segoe UI"', 'sans-serif'].join(','),
  h1: {
    fontSize: defaultTheme.typography.pxToRem(48),
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: defaultTheme.typography.pxToRem(36),
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: defaultTheme.typography.pxToRem(30),
    lineHeight: 1.2,
  },
  h4: {
    fontSize: defaultTheme.typography.pxToRem(24),
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: defaultTheme.typography.pxToRem(20),
    fontWeight: 600,
  },
  h6: {
    fontSize: defaultTheme.typography.pxToRem(18),
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: defaultTheme.typography.pxToRem(18),
  },
  subtitle2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 500,
  },
  body1: {
    fontSize: defaultTheme.typography.pxToRem(14),
  },
  body2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 400,
  },
  caption: {
    fontSize: defaultTheme.typography.pxToRem(12),
    fontWeight: 400,
  },
};


export const shape = {
  borderRadius: 8,
};

const defaultShadows = [
  'var(--mui-palette-baseShadow)',
  ...defaultTheme.shadows.slice(1),
];
export const shadows = defaultShadows;
