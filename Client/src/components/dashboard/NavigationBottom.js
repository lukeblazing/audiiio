import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
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

const IconWrapper = styled(Box)({
  width: 'clamp(43px, 10vw, 50px)',
  height: 'clamp(43px, 10vw, 50px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
});

const DockShell = styled(Paper)({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  height: "12vh",
  paddingLeft: "10vw",
  paddingRight: "10vw",
  paddingBottom: "3vh",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: "#0f172a",
  '--icon-size': 'clamp(43px, 10vw, 50px)',
  borderTop: "3px solid rgba(255, 255, 255, 0.12)",
});

export default function NavigationBottom() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <DockShell elevation={0}>
        {/* Menu */}
        <IconWrapper onClick={() => setDrawerOpen(true)}>
          <MenuRoundedIcon sx={{ fontSize: 'var(--icon-size)' }} />
        </IconWrapper>

        {/* Links */}
        {navLinks.map(({ to, icon: Icon }) => {
          const isSelected = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              style={{ textDecoration: 'none', color: isSelected ? '#3C84FF' : 'inherit' }}
            >
              <IconWrapper >
                <Icon width="70%" height="70%" />
              </IconWrapper>
            </Link>
          );
        })}

        {/* Refresh */}
        <IconWrapper onClick={() => window.location.reload()}>
          <RefreshIcon sx={{ fontSize: 'var(--icon-size)' }} />
        </IconWrapper>
      </DockShell>

      <SideMenuMobile open={drawerOpen} toggleDrawer={setDrawerOpen} />
    </>
  );
}
