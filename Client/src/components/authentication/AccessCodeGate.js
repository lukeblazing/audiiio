import React, { useRef, useState } from 'react';
import MuiCard from '@mui/material/Card';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { styled, useTheme } from '@mui/material/styles';
import LoadingSpinner from '../loading-components/LoadingSpinner';
import { useAuth } from './AuthContext';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '420px',
  },
  borderRadius: theme.spacing(2),
  boxShadow:
    'rgba(0, 0, 0, 0.05) 0px 5px 15px, rgba(0, 0, 0, 0.05) 0px 15px 35px -5px',
}));

const ModalContainer = styled(Stack)(({ theme }) => ({
  paddingLeft: 20,
  paddingRight: 20,
  height: '100vh',
  minHeight: 500,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  background: theme.palette.background.default,
}));

function AccessCodeInputModal() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { handleAccessCodeGranted } = useAuth(); // Add this to your context if not present
  const inputRef = useRef();
  const theme = useTheme();

  const handleChange = (e) => {
    // Accept only numbers and limit to 5 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setAccessCode(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (accessCode.length !== 5) {
      setError('Enter the 5-digit access code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/submitAccessCode`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        handleAccessCodeGranted(true);
      } else {
        setError(result.message || 'Invalid access code');
        setAccessCode('');
      }
    } catch (err) {
        console.log(err)
      setError('Network error, try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Focus the input when the modal mounts (esp. for iOS PWAs)
  React.useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  return (
    <ModalContainer>
      <CssBaseline enableColorScheme />
      <Card variant="outlined">
        <Box display="flex" alignItems="center">
          <Typography
            variant="h6"
            sx={{
              marginLeft: 1,
              fontWeight: 'bold',
              fontFamily: 'Roboto, sans-serif',
              fontSize: '1.3rem',
            }}
          >
            Access Code
          </Typography>
        </Box>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            mt: 2,
          }}
        >
          <FormControl fullWidth>
            <TextField
              inputRef={inputRef}
              id="access-code-input"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="12345"
              autoFocus
              value={accessCode}
              onChange={handleChange}
              error={Boolean(error)}
              helperText={error}
              inputProps={{
                maxLength: 5,
                inputMode: 'numeric',
                pattern: '[0-9]*',
                style: { fontSize: '2rem', letterSpacing: '0.5rem', textAlign: 'center' },
              }}
              disabled={isLoading}
              variant="outlined"
              fullWidth
            />
          </FormControl>
          <Button
            type="submit"
            disableRipple
            variant="contained"
            disabled={isLoading || accessCode.length !== 5}
            sx={{
              position: 'relative',
              fontWeight: 700,
              fontSize: '1.1rem',
              letterSpacing: 1,
              py: 1.2,
            }}
            fullWidth
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
          </Button>
        </Box>
      </Card>
    </ModalContainer>
  );
}


const AccessCodeGate = ({ children }) => {
  const { hasAccessCode } = useAuth();

  // Optionally, you could expose a loading state too!
  if (hasAccessCode === null) return <LoadingSpinner />;
  if (!hasAccessCode) return <AccessCodeInputModal />;

  return <>{children}</>;
};

export default AccessCodeGate;
