import React, { useState, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { LogoIcon, MicrosoftIcon } from './CustomIcons.js';
import { useAuth } from './AuthContext.js';
import LoadingSpinner from '../loading-components/LoadingSpinner.js';

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
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  paddingLeft: 20,
  paddingRight: 20,
  height: '100%',
  position: 'relative',
  zIndex: 0,
}));

export default function SignUp() {
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  // Refs for form inputs
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const validateInputs = () => {
    const name = nameRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const password = passwordRef.current.value.trim();

    let isValid = true;

    // Validate Name
    if (!name) {
      setNameError(true);
      setNameErrorMessage('Name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    // Validate Email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    // Validate Password
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
      return; // Stop form submission if validation fails
    }

    setIsLoading(true);

    const data = new FormData(event.currentTarget);
    const name = data.get('name').trim();
    const email = data.get('email').trim();
    const password = data.get('password').trim();

    try {
      // Sending Sign Up data to the server for verification
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/signUp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const responseJSON = await response.json();

      if (response.ok) {
        handleLogin(responseJSON); // Log the user in
        navigate('/'); // Redirect to the home page after successful signup
      } else {
        setPasswordError(true);
        setPasswordErrorMessage(responseJSON.message || 'There was an error signing up.');
      }
    } catch (error) {
      console.error('Error during sign up:', error);
      setPasswordError(true);
      setPasswordErrorMessage('There was an error signing up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="safe-area-wrapper">
      {isLoading && <LoadingSpinner />}
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
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
              Welcome
            </Typography>
          </Box>
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign up
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            noValidate
          >
            <FormControl fullWidth>
              <FormLabel htmlFor="sign-up-name">Full name</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                id="sign-up-name" // Unique ID
                placeholder="Jon Snow"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
                inputRef={nameRef} // Attach ref
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="sign-up-email">Email</FormLabel>
              <TextField
                required
                fullWidth
                id="sign-up-email" // Unique ID
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
                variant="outlined"
                error={emailError}
                helperText={emailErrorMessage}
                color={emailError ? 'error' : 'primary'}
                inputRef={emailRef} // Attach ref
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="sign-up-password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="sign-up-password" // Unique ID
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
                inputRef={passwordRef} // Attach ref
              />
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="allowExtraEmails" color="primary" />}
              label="I want to receive updates via email."
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disableRipple
              disabled={isLoading} // Disable the button when loading
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '3rem', // Optional: Set a consistent height
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} color="inherit" />
                  <Typography variant="button" sx={{ marginLeft: 1 }}>
                    Signing up...
                  </Typography>
                </>
              ) : (
                'Sign up'
              )}
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <span>
                <Link component={RouterLink} to="/sign-in" variant="body2">
                  Sign in
                </Link>
              </span>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </div>
  );
}
