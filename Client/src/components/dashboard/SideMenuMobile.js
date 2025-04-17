import * as React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuButton from './MenuButton.js';
import MenuContent from './MenuContent.js';
import { useAuth } from '../authentication/AuthContext.js';
import usePushSubscription from '../calendar/usePushSubscription';

function SideMenuMobile({ open, toggleDrawer }) {
  const { handleLogout, userData } = useAuth();
  const { enablePushSubscription } = usePushSubscription();

  const attemptLogout = async () => {
    try {
      // Make the API request to logout
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include', // Send cookies with the request
      });

      if (response.ok) {
        // Call handleLogout to update the context after successful logout
        handleLogout();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          backgroundImage: 'none',
          backdropFilter: 'blur(22px)',
          background: 'transparent',
          paddingTop: 'env(safe-area-inset-top, 16px)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        },
      }}
    >
      <Stack
        sx={{
          maxWidth: '70dvw',
          minWidth: '20dvw',
          height: '100%',
        }}
      >
        <Stack direction="row" sx={{ p: 2, pb: 0, gap: 1 }}>
          <Stack
            direction="row"
            sx={{ gap: 1, alignItems: 'center', flexGrow: 1, p: 1 }}
          >
            <Avatar
              sizes="small"
              alt={userData ? userData.name : "User"}
              src="icons/app-icon-v4.png"
              sx={{ width: 24, height: 24 }}
            />
            <Typography component="p" variant="h6">
              {userData ? userData.name : 'User'}
            </Typography>
          </Stack>
          <MenuButton onClick={enablePushSubscription} sx={{ border: 'none' }}>
            <NotificationsRoundedIcon />
          </MenuButton>
        </Stack>
        <Divider />
        <Stack sx={{ flexGrow: 1 }}>
          <MenuContent />
          <Divider />
        </Stack>
        <Stack sx={{ p: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            disableRipple
            startIcon={<LogoutRoundedIcon />}
            onClick={attemptLogout}
            sx={{
              paddingLeft: { xs: '20vw', sm: '15vw', md: '100px' }, // Use viewport width (vw) on smaller screens, pixel-based for larger screens
              paddingRight: { xs: '20vw', sm: '15vw', md: '100px' },
              textTransform: 'none',
            }}
          >
            Logout
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}

SideMenuMobile.propTypes = {
  open: PropTypes.bool,
  toggleDrawer: PropTypes.func.isRequired,
};

export default SideMenuMobile;
