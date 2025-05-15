import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MinimizeIcon from '@mui/icons-material/Minimize';
import WidgetsIcon from '@mui/icons-material/Widgets';
import GrainIcon from '@mui/icons-material/Grain';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import { getElementStyle } from './../utils';

// Replace your icon exports:
export const add = <AddIcon style={getElementStyle('icon')} />;
export const trash = <DeleteOutlineIcon style={getElementStyle('icon')} />;
export const menu = <MoreHorizIcon style={getElementStyle('icon')} />;
export const hide = <VisibilityOffIcon style={getElementStyle('icon')} />;
export const show = <MinimizeIcon style={getElementStyle('icon')} />;
export const normalview = <WidgetsIcon style={getElementStyle('icon')} />;
export const bubbleview = <GrainIcon style={getElementStyle('icon')} />;
export const pageview = <FullscreenIcon style={getElementStyle('icon')} />;
export const upload = <CloudUploadIcon style={getElementStyle('icon')} />;
export const fullscreen = <FullscreenExitIcon style={getElementStyle('icon')} />;
