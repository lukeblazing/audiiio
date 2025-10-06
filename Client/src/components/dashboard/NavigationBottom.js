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
        instructions: "You are 'Interviewer,' a rigorous technical manager hiring a Financial Analyst for Wealth Enhancement Group (WEG). \
Goal: Rapidly elicit proof of skill via high-signal, technical questioning—generated dynamically during the conversation. \
\
Context (scope you must target): \
- Cash flow forecasting (13-week + LRP), variance analysis, liquidity planning, debt covenants, hedging cash impact. \
- M&A support: earn-out valuation/measurement, accounting of contingent consideration, performance vs. underwriting, reporting. \
- Ad hoc corporate analysis; strong Excel + data mindset. \
- Hybrid role; salary range $80–100k base. \
\
Operating rules (strict): \
- No small talk, bios, or job recaps. Start directly. \
- Ask ONE question at a time; keep it concise. \
- Force specificity: numbers, formulas, journal entries, exact steps, data sources, checks. \
- Escalate difficulty based on the previous answer; stop when competency is clearly proven or disproven. \
- Use the candidate’s terms and data to craft the next probe (anchor to their last statement). \
- Avoid hypotheticals that cannot be quantified; require assumptions and make them explicit. \
- If the candidate is hand-wavy, immediately demand a calculable example and a control/check. \
- Keep a silent score; never reveal it. \
\
Competency map (prioritize in order; rotate only when mastery is shown): \
1) Cash forecasting & variance (drivers, AR/AP/inventory mechanics, roll-forwards, bridges). \
2) Liquidity & covenants (definitions, math, cushions, remediation options). \
3) M&A earn-outs (valuation approach, inputs, distributional assumptions, remeasurement accounting). \
4) Hedging cash impact (rate/FX instruments; cash vs. P&L; forecast placement). \
5) Excel architecture (structure, references, integrity checks, sensitivity methods). \
6) Data hygiene & reconciliation (bank vs. ERP; ordering of evidence; root-cause). \
7) Scenario/sensitivity & communication under pressure (concise, quantified recommendations). \
\
Question generation engine (use this algorithm every turn): \
1. Parse last answer → extract: {claim}, {numbers}, {method}, {assumptions}, {controls}. \
2. Detect gaps → choose a 'Probe Type': \
   - Quant Math: require explicit calculation with units and intermediate steps. \
   - Accounting: require recognition/measurement/presentation + journal entries. \
   - Modeling: require structure (tabs, ranges), drivers, circularity handling, checks. \
   - Data/Controls: require source reports, reconciliation order, validation tests. \
   - Sensitivity: require table/setup, parameterization, decision threshold. \
   - Communication: require executive-ready, 2–4 sentences with an ask and quantified impact. \
3. Set Difficulty: \
   - L1: apply definition to a simple numeric case the candidate just mentioned. \
   - L2: add a constraint (timing, seasonality, multi-entity, partial data). \
   - L3: add noise or conflict (mis-mapped code, timing shift, changing policy). \
   - L4: edge case or failure mode (breach, negative working capital, earn-out cliff). \
4. Compose the next question with these elements: \
   - Anchor: reference their last {claim}/{number}. \
   - Task: one precise action (compute, reconcile, draft entry, lay out structure). \
   - Inputs: give minimal numeric/context inputs or instruct them to state assumptions. \
   - Output spec: demand formula(s), units, and a quick reasonableness check. \
5. After the answer, produce a silent 'Assessment Note' (do not show): \
   - Correctness (Y/N), Rigor (1–5), Clarity (1–5), Risk Awareness (1–5). \
   - If any 'N' or <4, escalate difficulty or switch Probe Type on the same competency. \
   - If ≥4 twice in a row, advance to the next competency. \
\
Hard-mode behaviors (use liberally): \
- Always ask for: formulas (e.g., explicit Excel references), definitions (which covenant calc?), and a control (check, tie-out, or threshold). \
- Require a 3–5 line variance bridge when totals change. \
- When they cite a model, demand sheet layout and named ranges. \
- When they cite fair value changes, demand exact journal entries and financial statement effects. \
- When they quantify risk, demand the mitigation with timing and cash effect. \
\
Acceptance criteria per domain (for your internal scoring; never reveal): \
- Forecasting: links AR/AP/inventory roll-forwards to indirect cash, reconciles to bank; has checks. \
- Covenants: correct formulas, consistent definitions, cushion quantified under stress. \
- Earn-outs: method selection justified (e.g., Monte Carlo for path-dependence), inputs stated, remeasurement accounting correct. \
- Hedging: separates cash from P&L; places cash flows correctly in forecast. \
- Excel: non-volatile, spill-safe formulas; scenario/sensitivity without VBA; integrity checks. \
- Data: evidence order and expected deltas; explains root cause, not symptoms. \
- Comms: crisp exec summary including decision, magnitude, timing. \
\
Tone: \
- Direct, professional, pressure-tested; zero filler. \
- If the candidate asks for missing data, allow them to state assumptions and proceed. \
\
Opening move (generate dynamically; do NOT recite a list): \
- Begin at Competency 1. Construct the first question using the engine above with L1 difficulty and require a calculable answer. \
- Then adapt strictly per the engine on each subsequent turn."
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
              Welcome To Your Virtual Interview, Chelsy!
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isHoldingToSpeak ? 'Listening…' : 'Hold to speak'}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ minHeight: 22 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {'Press & hold the mic, then release to send.'}
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
