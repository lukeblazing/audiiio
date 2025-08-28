// NavigationBottom.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, IconButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Calendar /*, DollarSign */ } from 'lucide-react';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { Link, useLocation } from 'react-router-dom';
import SideMenuMobile from './SideMenuMobile';
import { useAuth } from '../authentication/AuthContext';
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

const navLinks = [
  { to: '/', icon: Calendar, label: 'Calendar' },
  // { to: '/spending', icon: DollarSign, label: 'Spending' },
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
  height: '10vh',
  paddingLeft: '10vw',
  paddingRight: '10vw',
  paddingBottom: '3vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#0f172a',
  '--icon-size': 'clamp(25px, 10vw, 35px)',
  borderTop: '3px solid rgba(255, 255, 255, 0.12)',
  zIndex: 1200,
});

export default function NavigationBottom() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // auth gating to mirror DayEventsModal behavior
  const { isAuthenticated } = useAuth();

  // realtime mic state
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [micError, setMicError] = useState(null);

  const sessionRef = useRef(null);
  const agentRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (isRecording) stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const startRecording = async () => {
    if (isRecording || isConnecting) return;
    if (!window || !window.MediaRecorder) {
      setMicError('Your browser does not support MediaRecorder.');
      return;
    }
    setMicError(null);
    setIsConnecting(true);

    try {
      // 1) Mint ephemeral key from your server
      const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/realtime`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const { value: ephemeralKey } = await resp.json();
      if (!ephemeralKey) throw new Error('No ephemeral key in response');

      // 2) Create the assistant
      const agent = new RealtimeAgent({
        name: 'Assistant',
        instructions: 'You are a helpful assistant. Answer clearly and briefly.',
      });

      // 3) Create the session
      const session = new RealtimeSession(agent, { model: 'gpt-realtime' });

      // 4) Optional streaming hooks
      session.on('response.delta', () => {});
      session.on('response.completed', () => {});
      session.on('transcript.delta', () => {});
      session.on('error', () => setMicError('Voice session error.'));

      // 5) Connect (prompts for mic; VAD handles turns)
      await session.connect({ apiKey: ephemeralKey });

      sessionRef.current = session;
      agentRef.current = agent;
      if (isMountedRef.current) setIsRecording(true);
    } catch (e) {
      console.warn(e);
      if (isMountedRef.current) setMicError('Could not start voice assistant.');
    } finally {
      if (isMountedRef.current) setIsConnecting(false);
    }
  };

  const stopRecording = () => {
    const s = sessionRef.current;
    sessionRef.current = null;
    agentRef.current = null;
    try {
      if (s) s.close();
    } catch (e) {
      console.warn(e);
    }
    if (isMountedRef.current) setIsRecording(false);
  };

  return (
    <>
      <DockShell elevation={0}>
        {/* Menu */}
        <IconWrapper onClick={() => setDrawerOpen(true)} aria-label="Open menu">
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
              <IconWrapper aria-label={`Go to ${to}`}>
                <Icon width="60%" height="60%" />
              </IconWrapper>
            </Link>
          );
        })}

        {/* Mic (new) */}
        <IconWrapper
          aria-label={isRecording ? 'Recording in progress' : 'Start voice assistant'}
          onClick={() => {
            if (!isAuthenticated) return; // optional gating like the modal
            if (isRecording) return;
            startRecording();
          }}
          style={{ opacity: isAuthenticated ? 1 : 0.5, pointerEvents: isAuthenticated ? 'auto' : 'none' }}
        >
          {isConnecting ? (
            <CircularProgress size={28} />
          ) : (
            <MicIcon sx={{ fontSize: 'var(--icon-size)' }} />
          )}
        </IconWrapper>

        {/* Refresh */}
        <IconWrapper onClick={() => window.location.reload()} aria-label="Refresh">
          <RefreshIcon sx={{ fontSize: 'var(--icon-size)' }} />
        </IconWrapper>
      </DockShell>

      <SideMenuMobile open={drawerOpen} toggleDrawer={setDrawerOpen} />

      {/* Recording overlay */}
      {isRecording && (
        <Box
          role="dialog"
          aria-label="Recording in progress"
          sx={{
            position: 'fixed',
            inset: 0,
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0,0,0,0.25)',
            zIndex: 1301,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={stopRecording}
            sx={{
              bgcolor: 'error.main',
              color: '#fff',
              width: 80,
              height: 80,
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <StopIcon sx={{ fontSize: 40 }} />
          </IconButton>
        </Box>
      )}

      {/* Quick inline error toast */}
      {micError && (
        <Box
          sx={{
            position: 'fixed',
            bottom: '12vh',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1302,
          }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(220, 38, 38, 0.9)',
              color: '#fff',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontSize: 14,
            }}
          >
            {micError}
          </Box>
        </Box>
      )}
    </>
  );
}
