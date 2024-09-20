import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';

function ForgotPassword({ isForgotPwdOpen, handleForgotPwdClose }) {
  const handleForgotPasswordSubmit = (event) => {
    event.preventDefault();  // Prevent the default form submission behavior
    alert('Forgot password functionality is not yet supported.')
    handleForgotPwdClose(); // Close the dialog after form submission
  };

  return (
    <Dialog
      isForgotPwdOpen={isForgotPwdOpen}
      onClose={handleForgotPwdClose}
    >
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Enter your account&apos;s email address, and we&apos;ll send you a link to reset your password.
        </DialogContentText>
        <form onSubmit={handleForgotPasswordSubmit}>
          <OutlinedInput
            autoFocus
            required
            margin="dense"
            id="email"
            name="email"
            label="Email address"
            placeholder="Email address"
            type="email"
            fullWidth
          />
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
