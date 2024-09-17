import * as React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export function MicrosoftIcon() {
  return (
    <SvgIcon>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M12 12H3V3h9v9z" fill="#F35325" />
        <path d="M21 12h-9V3h9v9z" fill="#81BC06" />
        <path d="M12 21H3v-9h9v9z" fill="#05A6F0" />
        <path d="M21 21h-9v-9h9v9z" fill="#FFBA08" />
      </svg>
    </SvgIcon>
  );
}

export function LogoIcon() {
  return (
    <SvgIcon>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="5" fill="#FFDD57" /> {/* Sun's core */}
        <path
          d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
          stroke="#FFDD57"
          strokeWidth="2"
        />
      </svg>
    </SvgIcon>
  );
}
