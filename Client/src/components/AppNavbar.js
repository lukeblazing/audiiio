import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MuiToolbar from '@mui/material/Toolbar';
import { tabsClasses } from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SideMenuMobile from './SideMenuMobile.js';
import MenuButton from './MenuButton.js';

const Toolbar = styled(MuiToolbar)({
  width: '100%',
  padding: '12px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'start',
  justifyContent: 'center',
  gap: '12px',
  flexShrink: 0,
  [`& ${tabsClasses.flexContainer}`]: {
    gap: '8px',
    p: '8px',
    pb: 0,
  },
});

export default function AppNavbar() {
  const [open, setOpen] = React.useState(false);

  console.log("navbar is rendering luke")

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        display: { xs: 'flex', md: 'flex' },
        boxShadow: 0,
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        top: 'var(--template-frame-height, 0px)',
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
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexGrow: 1 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: 'text.primary', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
            >
              Luke's cool site
            </Typography>
          </Stack>
          <SideMenuMobile open={open} toggleDrawer={toggleDrawer} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
