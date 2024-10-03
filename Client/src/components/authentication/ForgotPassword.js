import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { useRef } from 'react';

function ForgotPassword({ isForgotPwdOpen, handleForgotPwdClose }) {
  const emailRef = useRef(null); // Use ref for email input

  const handleForgotPasswordSubmit = (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    const email = emailRef.current.value;
    if (email) {
      // Implement actual forgot password logic here
      alert(`Password reset link sent to ${email}`);
    } else {
      alert('Please enter your email address.');
    }
    handleForgotPwdClose(); // Close the dialog after form submission
  };

  return (
    <Dialog
      open={isForgotPwdOpen}
      onClose={handleForgotPwdClose}
      aria-labelledby="forgot-password-dialog-title"
      aria-describedby="forgot-password-dialog-description"
    >
      <DialogTitle id="forgot-password-dialog-title">Reset Password</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText id="forgot-password-dialog-description">
          Enter your account's email address, and we'll send you a link to reset your password.
        </DialogContentText>
        <form onSubmit={handleForgotPasswordSubmit}>
          <FormControl variant="outlined" fullWidth required>
            <InputLabel htmlFor="forgot-email">Email Address</InputLabel>
            <OutlinedInput
              autoFocus
              margin="dense"
              id="forgot-email" // Unique ID
              name="forgot-email"
              type="email"
              placeholder="Email address"
              label="Email Address"
              inputRef={emailRef} // Attach ref
            />
          </FormControl>
          <DialogActions sx={{ pb: 3, px: 3 }}>
            <Button onClick={handleForgotPwdClose}>Cancel</Button>
            <Button variant="contained" type="submit">
              Continue
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleForgotPwdClose: PropTypes.func.isRequired,
  isForgotPwdOpen: PropTypes.bool.isRequired,
};

export default ForgotPassword;
