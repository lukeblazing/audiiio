// DashboardLayout.jsx
import React from 'react';
import NavigationBottom from './NavigationBottom'; // Your bottom nav
import { Outlet } from 'react-router-dom';

export default function NavbarLayoutPage() {
  return (
    <>
      <Outlet />
      <NavigationBottom />
    </>
  );
}
