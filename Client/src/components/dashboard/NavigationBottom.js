import React, { useRef, useState, useLayoutEffect } from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Calendar, Bell, Wallet } from 'lucide-react';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link, useLocation } from 'react-router-dom';
import SideMenuMobile from './SideMenuMobile';

const navLinks = [
  { to: '/', icon: Calendar, label: 'Calendar' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/spending', icon: Wallet, label: 'Spending' },
];



const Divider = styled('span')({
  width: 2,
  height: 'calc(var(--btn-size) * 0.69)',
  borderRadius: 2,
  background: 'rgba(255,255,255,0.23)',
  margin: '0 6px', // tighter spacing
  flexShrink: 0,
});

const DockShell = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  left: 16,
  right: 16,
  bottom: 33,
  margin: '0 auto',
  maxWidth: 520,
  width: '90vw',
  padding: '10px 16px',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'transparent',
  backdropFilter: 'blur(14px)',
  overflow: 'hidden',
  gap: 0,
  minWidth: 0,
  '--btn-size': 'clamp(42px, 12vw, 55px)',
  '--icon-size': 'clamp(33px, 8vw, 40px)',
  '--gap': 'clamp(7px, 4vw, 18px)',
}));

const NavBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--gap)',
  flexShrink: 1,
  flexGrow: 1,
  minWidth: 0,
});

export default function NavigationBottom() {
  const theme = useTheme();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedIndex = navLinks.findIndex(link => link.to === pathname);

  // --- Add refs array for BubbleButtons
  const buttonRefs = useRef([]);

  // --- Store left value for SlidingBorder
  const [borderLeft, setBorderLeft] = useState(0);

  // --- Calculate position on selectedIndex change
  useLayoutEffect(() => {
    if (selectedIndex >= 0 && buttonRefs.current[selectedIndex]) {
      setBorderLeft(buttonRefs.current[selectedIndex].offsetLeft);
    }
  }, [selectedIndex]);

  // If navLinks ever changes in length, clear out refs to avoid leftover nodes
  useLayoutEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, navLinks.length);
  }, []);

  return (
    <>
      <Box sx={{ flexShrink: 0 }} />

      <DockShell elevation={0}>
        {/* Menu */}
        <MenuRoundedIcon onClick={() => setDrawerOpen(true)} sx={{ fontSize: 'var(--icon-size)' }} />

        <NavBox>
          {navLinks.map(({ to, icon: Icon }, idx) => {
            const isSelected = pathname === to;
            return (
              <Link key={to} to={to} style={{ textDecoration: 'none', color: 'unset', }}>
                <Box
                  ref={el => (buttonRefs.current[idx] = el)}
                  sx={{
                    width: 'var(--btn-size)',
                    height: 'var(--btn-size)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 280ms cubic-bezier(.22,1,.36,1)',
                    color: pathname === to ? '#3C84FF' : 'inherit',
                  }}
                >
                  <Icon style={{ fontSize: 'var(--icon-size)' }} />
                </Box>
              </Link>
            );
          })}
        </NavBox>

        {/* Refresh */}
        <RefreshIcon onClick={() => window.location.reload()} sx={{ fontSize: 'var(--icon-size)' }} />
      </DockShell>

      <SideMenuMobile open={drawerOpen} toggleDrawer={setDrawerOpen} />
    </>
  );
}
