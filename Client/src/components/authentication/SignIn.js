import React, { useState, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ForgotPassword from './ForgotPassword.js';
import { MicrosoftIcon, LogoIcon } from './CustomIcons.js';
import { useAuth } from './AuthContext.js';
import LoadingSpinner from '../loading-components/LoadingSpinner.js';
import { useTheme } from "@mui/material/styles";

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  borderRadius: theme.spacing(2),
  boxShadow:
    'rgba(0, 0, 0, 0.05) 0px 5px 15px, rgba(0, 0, 0, 0.05) 0px 15px 35px -5px',
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  padding: 20,
  minHeight: '100vh',
  position: 'relative',
  zIndex: 0,
}));

export default function SignIn() {
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [isForgotPwdOpen, setIsForgotPwdOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  // Refs for form inputs
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleForgotPwdOpen = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsForgotPwdOpen(true);
  };

  const handleForgotPwdClose = () => {
    setIsForgotPwdOpen(false);
  };

  const validateInputs = () => {
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const responseJSON = await response.json();

      if (response.ok) {
        handleLogin(responseJSON); // Log the user in
        navigate('/'); // Redirect to the home page after successful login
      } else {
        setPasswordError(true);
        setPasswordErrorMessage(responseJSON.message || 'There was an error logging in.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setPasswordError(true);
      setPasswordErrorMessage('There was an error logging in. Please try again!!');
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="center" >
        <Card variant="outlined">
          <Box display="flex" alignItems="center">
            <LogoIcon />
            <Typography
              variant="h6"
              sx={{
                marginLeft: 1,
                fontWeight: 'bold',
                fontFamily: 'Roboto, sans-serif',
                fontSize: '1.5rem',
              }}
            >
              Hello
            </Typography>
          </Box>
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
          >
            <FormControl fullWidth>
              <FormLabel htmlFor="sign-in-email">Email</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="sign-in-email" // Unique ID
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? 'error' : 'primary'}
                inputRef={emailRef} // Attach ref
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="sign-in-password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="sign-in-password" // Unique ID
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
                inputRef={passwordRef} // Attach ref
              />
            </FormControl>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap', // Allows wrapping on smaller screens
                gap: 1, // Adds spacing between items
                color: 'rgba(0, 0, 0, 0.6)'
              }}
            >
            </Box>
            <Button
              type="submit"
              disableRipple
              fullWidth
              variant="contained"
              disabled={isLoading} // Disable the button when loading
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1, // Adds space between spinner and text
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} color="inherit" />
                  <Typography variant="button" sx={{ marginLeft: 1 }}>
                    Signing in...
                  </Typography>
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              <span>
                <Link component={RouterLink} to="/" variant="body2">
                  Cancel
                </Link>
              </span>
            </Typography>
          </Box>
        </Card>
        <ForgotPassword
          isForgotPwdOpen={isForgotPwdOpen}
          handleForgotPwdClose={handleForgotPwdClose}
        />
      </SignInContainer>
    </div>
  );
}
