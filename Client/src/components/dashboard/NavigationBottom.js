// NavigationBottom.js
import React from 'react';
import {
  Box,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  IconButton,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Calendar, Bell, Wallet } from 'lucide-react';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link, useLocation } from 'react-router-dom';
import SideMenuMobile from './SideMenuMobile.js';

// Navigation links config
const navLinks = [
  { to: '/', icon: Calendar, label: 'Calendar' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/spending', icon: Wallet, label: 'Spending' },
];

// Clean, modern, minimal “water droplet” bar: totally transparent with a soft shadow and pill shape
const DropletPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 24,
  margin: '0 auto',
  width: '90vw',
  maxWidth: 520,
  padding: 8,
  borderRadius: 32,
  background: 'transparent',
  border: '1.5px solid rgba(255,255,255,0.10)',
  boxShadow: '0 6px 26px 3px rgba(30,40,70,0.07), 0 1.5px 8px rgba(0,0,0,0.10)',
  backdropFilter: 'blur(16px) saturate(1.1)',
  overflow: 'visible',
  WebkitTapHighlightColor: 'transparent',
}));

// Super minimal, glassy, “bubble” buttons, totally clear but outlined
const BubbleButton = styled(IconButton)(({ theme }) => ({
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: 'transparent',
  border: '1.5px solid rgba(255,255,255,0.16)',
  boxShadow: '0 2px 9px 1.5px rgba(30,40,70,0.08), 0 0.5px 3px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px) saturate(1.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.22s cubic-bezier(.2,1.8,.3,1.08), border-color 0.2s',
  '&:hover': {
    transform: 'scale(1.10)',
    borderColor: theme.palette.primary.main,
    background: 'rgba(0,0,0,0.05)',
  },
  '& svg': { fontSize: '2.05rem' },
}));

export default function NavigationBottom() {
  const theme = useTheme();
  const { pathname } = useLocation();

  // left-drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // refresh animation
  const [rotating, setRotating] = React.useState(false);
  const handleRefresh = () => {
    setRotating(true);
    setTimeout(() => window.location.reload(), 1);
  };

  return (
    <>
      {/* Spacer for layout */}
      <Box sx={{ height: 88, flexShrink: 0 }} />

      <DropletPaper elevation={0}>
        {/* ◉ left bubble – hamburger menu */}
        <BubbleButton
          aria-label="open menu"
          onClick={() => setDrawerOpen(true)}
          sx={{ position: 'absolute', left: 8, top: -28 }}
        >
          <MenuRoundedIcon />
        </BubbleButton>

        {/* ◉ right bubble – refresh */}
        <BubbleButton
          aria-label="refresh"
          onClick={handleRefresh}
          sx={{
            position: 'absolute',
            right: 8,
            top: -28,
            transform: rotating ? 'rotate(1turn)' : undefined,
            transition: rotating
              ? 'transform 0.6s cubic-bezier(.45,2.1,.4,.8)'
              : undefined,
          }}
        >
          <RefreshIcon />
        </BubbleButton>

        {/* Main nav links */}
        <BottomNavigation
          showLabels
          value={pathname}
          sx={{
            bgcolor: 'transparent',
            height: 56,
            px: 4, // more space for bubbles
          }}
        >
          {navLinks.map(({ to, icon: Icon, label }) => {
            const selected = pathname === to;
            return (
              <BottomNavigationAction
                key={to}
                component={Link}
                to={to}
                value={to}
                icon={
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition:
                        'transform 0.19s cubic-bezier(.2,1.8,.45,1.08)',
                      transform: selected ? 'scale(1.17)' : 'scale(1)',
                    }}
                  >
                    <Icon size={20} />
                  </Box>
                }
                label={label}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  py: 0.6,
                  borderRadius: 16,
                  color: selected
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: 'rgba(100,200,255,0.03)',
                    color: theme.palette.primary.main,
                  },
                  '.MuiBottomNavigationAction-label': {
                    mt: 0.5,
                    fontSize: '0.80rem',
                    fontWeight: 500,
                    textShadow: '0 1px 5px rgba(255,255,255,0.25)',
                    letterSpacing: 0.10,
                  },
                  '.MuiTouchRipple-root': { display: 'none' },
                }}
                disableRipple
              />
            );
          })}
        </BottomNavigation>
      </DropletPaper>

      {/* Drawer for hamburger menu */}
      <SideMenuMobile open={drawerOpen} toggleDrawer={setDrawerOpen} />
    </>
  );
}
