// AppNavbar.js
import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SideMenuMobile from './SideMenuMobile.js';
import MenuButton from './MenuButton.js';

// Styled Container using Box for layout with proper responsive height
const NavbarContainer = styled(Box)(({ theme }) => ({
  position: 'fixed', // Fixes the navbar at the top
  top: 0,
  left: 0,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  zIndex: theme.zIndex.appBar, // Ensures the navbar is above other elements

  // Default height for medium and larger screens
  height: '72px',

  // Responsive height adjustments using theme breakpoints
  [theme.breakpoints.down('sm')]: {
    height: '56px', // Height for small and extra-small screens
  },
}));

// Styled Typography for the "Events" text with custom font and bold weight
const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontFamily: 'Verdana, sans-serif', // Use a system font with fallback
  fontWeight: 'bold', // Make the text bold
  fontSize: '2rem', // Default font size

  position: 'absolute', // Position absolutely within NavbarContainer
  left: '50%', // Position at 50% from the left
  transform: 'translateX(-50%)', // Center the title by shifting it left by 50% of its width

  letterSpacing: '2px', // Adds spacing between letters
  // Remove flexGrow and textAlign as they're no longer needed
}));

export default function AppNavbar() {
  const [open, setOpen] = React.useState(false);

  // Function to toggle the drawer open state
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  return (
    <>
      <NavbarContainer>
        {/* Hamburger Menu Button on the Left with left spacing */}
        <Box sx={{ marginLeft: '16px' }}> {/* Adjust spacing as needed */}
          <MenuButton aria-label="menu" onClick={toggleDrawer(true)} size="large">
            {/* Increase the icon size using the sx prop */}
            <MenuRoundedIcon sx={{ fontSize: '2.5rem' }} />
          </MenuButton>
        </Box>

        {/* Centered "Events" Text */}
        <Title variant="h6" component="h1">
          Calendar
        </Title>

        {/* Placeholder to balance the layout */}
        <Box sx={{ width: '48px' }}></Box> {/* Adjust width to match MenuButton */}
      </NavbarContainer>

      {/* Side Drawer Component */}
      <SideMenuMobile open={open} toggleDrawer={toggleDrawer} />
    </>
  );
}
