// AppNavbar.js
import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import SideMenuMobile from './SideMenuMobile.js';
import MenuButton from './MenuButton.js';
import { useLocation } from 'react-router-dom';

// Styled Container using Box for layout with proper responsive height
const NavbarContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  zIndex: theme.zIndex.appBar, // Ensures the navbar is above other elements
  height: '72px',
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)'
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
}));

// Styled Refresh Button with an aesthetic rotation animation on hover
const RefreshButton = styled(IconButton)(({ theme }) => ({
  marginRight: '16px',
  transition: 'transform 0.5s ease',
}));

export default function AppNavbar() {
  const [open, setOpen] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);
  const location = useLocation();


  const pathNameMap = {
    //'/': 'Calendar',
  };

  const currentPath = location.pathname;
  const displayName = pathNameMap[currentPath] || '';

  const Title = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.primary,
    fontFamily: '"Roboto", "Segoe UI", Helvetica, Arial, sans-serif',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    letterSpacing: '2px',
  }));

  // Function to toggle the drawer open state
  const toggleDrawer = (newOpen) => {
    setOpen(newOpen);
  };

  // Function to refresh the page
  const handleRefresh = () => {
    setIsRotating(true);
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  return (
    <>
      <NavbarContainer>
        {/* Hamburger Menu Button on the Left with left spacing */}
        <Box sx={{ marginLeft: '16px' }}>
          <MenuButton aria-label="menu" onClick={() => toggleDrawer(true)} size="large" sx={{ border: 'none' }}>
            <MenuRoundedIcon sx={{ fontSize: '2.5rem' }} />
          </MenuButton>
        </Box>

        <Title variant="h6">{displayName}</Title>

        <RefreshButton aria-label="refresh" onClick={handleRefresh} sx={{ border: 'none', transition: 'transform 0.5s ease', transform: isRotating ? 'rotate(360deg)' : 'none', }}>
          <RefreshIcon sx={{ fontSize: '2.5rem' }} />
        </RefreshButton>
      </NavbarContainer>

      {/* Side Drawer Component */}
      <SideMenuMobile open={open} toggleDrawer={toggleDrawer} />
    </>
  );
}
