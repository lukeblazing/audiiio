import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Stack from '@mui/material/Stack';
import MuiToolbar from '@mui/material/Toolbar';
import { tabsClasses } from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SideMenuMobile from './SideMenuMobile.js';
import MenuButton from './MenuButton.js';
import { useAuth } from '../authentication/AuthContext.js';

const Toolbar = styled(MuiToolbar)(({ theme }) => ({
  width: '100%',
  padding: '8px', // Adjust padding for all screen sizes
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center', // Align items to the center for all screen sizes
  justifyContent: 'space-between',
  gap: '12px',
  flexShrink: 0,
  [`& ${tabsClasses.flexContainer}`]: {
    gap: '8px',
    p: '8px',
    pb: 0,
  },
  [theme.breakpoints.down('sm')]: {
    padding: '8px', // Adjust padding for mobile
  },
}));

export default function AppNavbar() {
  const [open, setOpen] = React.useState(false);

  const { handleLogout } = useAuth();

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        display: 'flex',
        boxShadow: 0,
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        top: 'var(--template-frame-height, 0px)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Toolbar variant="regular">
        <MenuButton aria-label="menu" onClick={toggleDrawer(true)}>
          <MenuRoundedIcon />
        </MenuButton>

        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexGrow: 1,
            width: '100%',
          }}
        >
          <Typography
            variant="h5" // Set a more responsive font size for mobile
            component="h1"
            sx={{
              color: 'text.primary',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' }, // Responsive font size
            }}
          >
            Luke's cool site
          </Typography>

          <SideMenuMobile open={open} toggleDrawer={toggleDrawer} handleLogout={handleLogout} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
