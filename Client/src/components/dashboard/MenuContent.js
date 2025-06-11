import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import Box from '@mui/material/Box';

const mainListItems = [
  { text: 'Calendar', icon: <HomeRoundedIcon />, path: '/' },
];

const secondaryListItems = [
  // { text: 'Settings', icon: <SettingsRoundedIcon /> },
  // { text: 'About', icon: <InfoRoundedIcon /> },
  // { text: 'Feedback', icon: <HelpRoundedIcon /> },
];

export default function MenuContent({ toggleDrawer }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (path) => {
    navigate(path);
    toggleDrawer(false);
  };

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              disableRipple
              selected={location.pathname === item.path}
              sx={{ py: 1.5 }}
              onClick={() => handleItemClick(item.path)}
            >
              <ListItemIcon sx={{ minWidth: 48 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '1.1rem' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box>
        <List>
          {secondaryListItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ display: 'block' }}>
              <ListItemButton sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 48 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '1.1rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Stack>
  );
}
