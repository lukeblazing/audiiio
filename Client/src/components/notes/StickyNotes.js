// StickyNotesPage.jsx
import React, { useCallback, useEffect, useRef } from 'react';
import ReactStickyNotes from './react-sticky-notes/src/app';
import AppNavbar from '../dashboard/AppNavbar';
import { Box } from '@mui/material';


/**
 * Debounce helper - keeps the latest timer in a ref so the
 * identity of the debounced function stays constant.
 */
function useDebouncedCallback(fn, delay = 500) {
  const timerRef = useRef(null);

  return useCallback(
    (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

function saveStickyNotes(notes) {
    return new Promise((resolve) => {
      console.log('Saving notes...', notes);
      resolve();
    });
  }

export default function StickyNotes() {
  /**
   * Persist the user’s notes.
   * The actual `saveStickyNotes(notes)` should return a
   * promise (or you can ignore the result if you wish).
   */
  const debouncedSave = useDebouncedCallback((notes) => {
    saveStickyNotes(notes).catch(console.error);
  }, 800); // slightly longer for typing comfort

  /**
   * Optional: if you already have notes in the DB you could
   * load them here and pass in the `notes` prop.
   * (Omitted because it wasn’t part of the prompt.)
   */
  console.log('ReactStickyNotes:', ReactStickyNotes);

  return (
    <>
    <AppNavbar />
    <Box
        sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'visible',
            paddingTop: 'calc(102px + env(safe-area-inset-top))'
        }}
    >
        <Box
            sx={{
                width: '90vw',
            }}
        >
        <ReactStickyNotes
          /* Make the board stretch to fill the area */
          containerWidth="100%"
          containerHeight="100%"
          footer={false}
          onChange={(type, payload, notes) => {
            // Persist every mutation (create, move, resize, edit, delete)
            debouncedSave(notes);
          }}
        />
    </Box>
    </Box>
    </>
  );
}
