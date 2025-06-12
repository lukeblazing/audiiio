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
  border: `2px solid ${theme.palette.divider}`,
  background: 'transparent',
  backdropFilter: 'blur(14px)',
  overflow: 'hidden',
  gap: 0,
  minWidth: 0,
  '--btn-size': 'clamp(42px, 12vw, 55px)',
  '--icon-size': 'clamp(23px, 6vw, 33px)',
  '--gap': 'clamp(7px, 4vw, 18px)',
}));

const Divider = styled('span')({
  width: 2,
  height: 'calc(var(--btn-size) * 0.69)',
  borderRadius: 2,
  background: 'rgba(255,255,255,0.23)',
  margin: '0 10px',
  flexShrink: 0,
});

const BubbleButton = styled(IconButton)(({ selected }) => ({
  width: 'var(--btn-size)',
  height: 'var(--btn-size)',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: selected ? 'scale(1.3)' : 'scale(1)',
  transition: 'all 280ms cubic-bezier(.22,1,.36,1)',
  color: selected ? '#3C84FF' : undefined,
  flexShrink: 0,
}));

const NavBox = styled(Box)({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 'var(--gap)',
  minWidth: 0,
  flexShrink: 1,
  flexGrow: 1,
});

const SlidingBorder = styled('span')({
  position: 'absolute',
  top: '50%',
  left: 0,
  width: 'var(--btn-size)',
  height: 'var(--btn-size)',
  borderRadius: 'calc(var(--btn-size) * 0.18 + 6px)',
  pointerEvents: 'none',
  zIndex: 1,
  border: '1.8px solid rgba(255,255,255,0.32)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.12) inset, 0 1px 3px rgba(0,0,0,0.12)',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.21) 0%, rgba(255,255,255,0.07) 80%)',
  backdropFilter: 'blur(9px)',
  transform: 'translateY(-50%)',
  transition: 'left 300ms cubic-bezier(.22,1,.36,1)',
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
        <BubbleButton onClick={() => setDrawerOpen(true)}>
          <MenuRoundedIcon sx={{ fontSize: 'var(--icon-size)' }} />
        </BubbleButton>

        <Divider />

        <NavBox>
          {selectedIndex >= 0 && (
            <SlidingBorder
              style={{
                left: borderLeft,
              }}
            />
          )}
          {navLinks.map(({ to, icon: Icon }, idx) => (
            <BubbleButton
              key={to}
              component={Link}
              to={to}
              selected={idx === selectedIndex}
              sx={{
                color: idx === selectedIndex
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
                position: 'relative',
                zIndex: 2,
              }}
              aria-label={navLinks[idx].label}
              ref={el => buttonRefs.current[idx] = el}
            >
              <Icon size="1em" style={{ fontSize: 'var(--icon-size)' }} />
            </BubbleButton>
          ))}
        </NavBox>

        <Divider />

        {/* Refresh */}
        <BubbleButton onClick={() => window.location.reload()}>
          <RefreshIcon sx={{ fontSize: 'var(--icon-size)' }} />
        </BubbleButton>
      </DockShell>

      <SideMenuMobile open={drawerOpen} toggleDrawer={setDrawerOpen} />
    </>
  );
}
