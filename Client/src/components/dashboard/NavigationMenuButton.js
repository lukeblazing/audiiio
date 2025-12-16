// NavigationMenuButton.jsx
import React, { useState } from 'react';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SideMenuMobile from './SideMenuMobile';

export default function NavigationMenuButton() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* HAMBURGER BUTTON */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          padding: 6,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
        }}
      >
        <MenuRoundedIcon sx={{ fontSize: 26 }} />
      </button>

      {/* SIDE DRAWER (mounted once) */}
      <SideMenuMobile
        open={drawerOpen}
        toggleDrawer={setDrawerOpen}
      />
    </>
  );
}
