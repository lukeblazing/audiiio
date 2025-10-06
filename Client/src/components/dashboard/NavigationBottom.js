// NavigationBottom.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, IconButton, CircularProgress, Typography, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Calendar /*, DollarSign */ } from 'lucide-react';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import MicIcon from '@mui/icons-material/Mic';
import CloseIcon from '@mui/icons-material/Close';
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

const OverlayCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(180deg, rgba(15,23,42,0.7), rgba(15,23,42,0.55))',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: '20px 24px',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  minWidth: 320,
  position: 'relative', // needed for the corner X button
}));

// CHANGE #2: make push-to-speak button ~2x size (was 88x88)
const BigCircleButton = styled(IconButton)(({ theme }) => ({
  width: 150,
  height: 150,
  borderRadius: '999px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  transition: 'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
  '&:active': { transform: 'scale(0.98)' },
}));

const LiveDot = styled('span')(({ theme }) => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#22c55e',
  marginRight: 8,
  boxShadow: '0 0 0 0 rgba(34,197,94, 0.7)',
  animation: 'pulse 1.6s infinite',
  '@keyframes pulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(34,197,94, 0.7)' },
    '70%': { boxShadow: '0 0 0 12px rgba(34,197,94, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(34,197,94, 0)' },
  },
}));

export default function NavigationBottom() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { isAuthenticated } = useAuth();

  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [micError, setMicError] = useState(null);

  const [isHoldingToSpeak, setIsHoldingToSpeak] = useState(false);

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
    setMicError(null);
    setIsConnecting(true);

    try {
      // 1) Get ephemeral key from your server
      const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL}/realtime`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const { value: ephemeralKey } = await resp.json();
      if (!ephemeralKey) throw new Error('No ephemeral key in response');

      // 2) Create agent
      const agent = new RealtimeAgent({
        name: 'Interviewer',
        instructions: "You are \"Interviewer,\" a rigorous technical manager hiring a Financial Analyst for Wealth Enhancement Group (WEG). \
Mode: VOICE-ONLY. Keep prompts brief, conversational, and interruptible. Do not ask the candidate to provide formulas, cell references, or explicit calculations. Elicit judgment, approach, and decision quality through discussion. \
\
Focus areas: \
- Cash flow forecasting, variance analysis, liquidity planning, debt covenants, hedging cash impact. \
- M&A support: earn-out valuation/measurement, accounting for contingent consideration, performance vs. underwriting, reporting. \
- Ad hoc corporate analysis; advanced Excel familiarity; strong data mindset. \
\
Operating rules: \
- Start directly; one question at a time; concise phrasing suitable for speech. \
- Probe based on their last answer; escalate difficulty only if warranted. \
- Ask for approach, decision criteria, signals/thresholds they watch, and how they’d communicate/align stakeholders. \
- No formula requests, no math quizzes, no screen shares or document walkthroughs. \
\
Voice-first behaviors: \
- Keep questions under ~12 seconds of speech. \
- If they ramble, politely refocus: “Let’s keep this tight—what were the top two drivers?” \
- Summarize back short takeaways to confirm understanding, then probe deeper. \
\
Competency map (advance only when demonstrated): \
1) Cash forecasting & variance (drivers, AR/AP/inventory mechanics, sources, checks, how they detect/explain misses) \
2) Liquidity & covenants (definitions they use, what they monitor, early-warning signals, remediation options) \
3) M&A earn-outs (why a valuation approach fits, inputs they rely on, how remeasurements are handled operationally, audit readiness) \
4) Hedging cash impact (how they separate cash vs. P&L, where this shows up in planning, coordination with treasury) \
5) Excel/modeling architecture (how they organize models, prevent errors, version control, dependency management—described verbally) \
6) Data hygiene & reconciliation (report ordering, tie-outs, common failure modes, root-cause habits) \
7) Scenario/sensitivity & communication (framings for decision-makers, tradeoffs, risk thresholds, contingency plans) \
\
Question generation engine (each turn): \
1. Extract from their last answer: {claim} {context} {decision} {evidence} {risk/controls}. \
2. Choose a probe type: Judgment; Process; Evidence; Risk/Controls; Communication. \
3. Set difficulty: L1 standard case; L2 constraint; L3 conflict; L4 edge case. \
4. Compose the next question: anchor to their last point; ask for approach, criteria, stakeholders, and the “tell” they’d watch for; require a brief verbal reasonableness/risk check—no numbers. \
\
Assessment (silent, never reveal): Rigor 1–5; Accounting correctness Y/N; Data sense 1–5; Communication 1–5. If weak, stay on the area and increase difficulty or switch probe type. \
\
Tone: Direct, professional, pressure-tested. No fluff. Encourage explicit but minimal assumptions. \
\
Role-play as the interview, ask question after question following the guidance above."
      });

      // 3) Create session with VAD disabled UPFRONT (prevents the handoffs error)
      const session = new RealtimeSession(agent, {
        model: 'gpt-realtime',
        config: {
          audio: {
            input: { turn_detection: null }, // manual push-to-talk
          },
        },
      });

      session.on?.('error', () => setMicError('Voice session error.'));

      // 4) Connect (WebRTC acquires mic/speaker under the hood)
      await session.connect({ apiKey: ephemeralKey });

      // Start muted until the user holds to speak
      session.mute?.(true);

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
      s?.removeAllListeners?.();
      s?.close?.();
    } catch (e) {
      console.warn(e);
    }
    if (isMountedRef.current) setIsRecording(false);
    setIsHoldingToSpeak(false);
  };

  // Push-to-talk via mute/unmute + sendMessage
  const beginSpeakHold = () => {
    if (!sessionRef.current) return;
    setIsHoldingToSpeak(true);
    try {
      sessionRef.current.mute?.(false);
    } catch (e) {
      console.warn(e);
    }
  };

  const endSpeakHold = async () => {
    if (!sessionRef.current) return;
    setIsHoldingToSpeak(false);
    try {
      sessionRef.current.mute?.(true);
      await sessionRef.current.sendMessage?.({
        response: { modalities: ['audio'] },
      });
    } catch (e) {
      console.warn(e);
    }
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

        {/* Mic (launcher) */}
        <IconWrapper
          aria-label={isRecording ? 'Recording in progress' : 'Start voice assistant'}
          onClick={() => {
            if (!isAuthenticated) return;
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

      {/* Recording overlay UI */}
      {isRecording && (
        <Box
          role="dialog"
          aria-label="Realtime assistant"
          sx={{
            position: 'fixed',
            inset: 0,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(2,6,23,0.55)',
            zIndex: 1301,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between', // <-- distribute top/mid/bottom
            alignItems: 'center',
            p: 2,
          }}
          onTouchMove={(e) => e.preventDefault()}
        >
          {/* Top: Text/Status */}
          <Stack spacing={1} alignItems="center" sx={{ mt: 4 }}>
            <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.9 }}>
              INTERVIEWER
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {'Welcome To The Virtual Interview!'}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ minHeight: 22 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {isHoldingToSpeak ? 'Listening…' : 'Hold to speak'}
              </Typography>
            </Stack>
          </Stack>

          {/* Middle: Centered Mic */}
          <BigCircleButton
            aria-label="Hold to speak"
            onMouseDown={beginSpeakHold}
            onMouseUp={endSpeakHold}
            onMouseLeave={() => isHoldingToSpeak && endSpeakHold()}
            onTouchStart={(e) => { e.preventDefault(); beginSpeakHold(); }}
            onTouchEnd={(e) => { e.preventDefault(); endSpeakHold(); }}
            tabIndex={0}
            disableRipple
            disableFocusRipple
            sx={{
              bgcolor: isHoldingToSpeak ? 'primary.dark' : 'primary.main',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <MicIcon sx={{ fontSize: 88 }} />
          </BigCircleButton>

          {/* Bottom: Close Button */}
          <IconButton
            aria-label="Close"
            disableRipple
            disableFocusRipple
            onClick={stopRecording}
            sx={{
              mb: 4,
              color: '#fff',
              width: 72,
              height: 72,
            }}
          >
            <CloseIcon sx={{ fontSize: 56 }} />
          </IconButton>
        </Box>
      )}


      {/* Inline error toast */}
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
              bgcolor: 'rgba(220, 38, 38, 0.95)',
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
