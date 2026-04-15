import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '@/config';

export const useFullscreenSecurity = ({ attemptId, enabled = true, onLockout }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);

  // Refs used inside event handlers — updated immediately so every callback
  // sees the correct value regardless of React's async render cycle.
  const isFullscreenRef = useRef(false);
  const isLockedOutRef = useRef(false);
  const exitCountRef = useRef(0);

  // Guards that prevent false-positive exit detection.
  //
  // enteringFullscreenRef: set while requestFullscreen() is in flight and kept
  // true for POST_ENTRY_GRACE_MS after it resolves.  Browsers (especially
  // Chrome/Firefox on Windows) fire a spurious fullscreenchange EXIT event
  // 50-200 ms after a legitimate ENTER during the OS-level window transition.
  // Without this guard that spurious event increments the violation counter.
  const enteringFullscreenRef = useRef(false);
  const enteringTimerRef = useRef(null);
  const POST_ENTRY_GRACE_MS = 700;

  // lastExitTimeRef: debounces rapid duplicate exit events (some browsers fire
  // multiple fullscreenchange events per Escape key press).
  const lastExitTimeRef = useRef(0);
  const EXIT_DEBOUNCE_MS = 500;

  // Keep secondary refs in sync with state (isFullscreenRef is kept current
  // synchronously inside the event handler; these two run after render).
  useEffect(() => { isLockedOutRef.current = isLockedOut; }, [isLockedOut]);
  useEffect(() => { exitCountRef.current = fullscreenExitCount; }, [fullscreenExitCount]);

  // ── Fullscreen support check ─────────────────────────────────────────────
  useEffect(() => {
    const supported = !!(
      document.documentElement.requestFullscreen ||
      document.documentElement.webkitRequestFullscreen ||
      document.documentElement.msRequestFullscreen
    );

    try {
      if (window.self !== window.top) {
        setFullscreenSupported(false);
        setShowFullscreenPrompt(false);
        return;
      }
    } catch {
      setFullscreenSupported(false);
      setShowFullscreenPrompt(false);
      return;
    }

    setFullscreenSupported(supported);
    if (!supported) {
      setShowFullscreenPrompt(false);
    }
  }, []);

  // ── Enter fullscreen ─────────────────────────────────────────────────────
  const enterFullscreen = async () => {
    // Signal that we are entering — suppress exit events until settled.
    enteringFullscreenRef.current = true;
    clearTimeout(enteringTimerRef.current);

    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenPrompt(false);
    } catch (error) {
      setFullscreenSupported(false);
      setShowFullscreenPrompt(false);
      axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
        event_type: 'fullscreen_not_supported'
      }).catch(() => {});
    } finally {
      // Keep the guard up for POST_ENTRY_GRACE_MS after promise settles so any
      // browser transition events that fire after the promise resolves are
      // also absorbed.
      enteringTimerRef.current = setTimeout(() => {
        enteringFullscreenRef.current = false;
      }, POST_ENTRY_GRACE_MS);
    }
  };

  // ── Handle a confirmed fullscreen exit breach ────────────────────────────
  const handleFullscreenExit = async () => {
    const newCount = exitCountRef.current + 1;
    setFullscreenExitCount(newCount);

    await axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
      event_type: 'fullscreen_exit_security_breach',
      exit_count: newCount
    }).catch(() => {});

    if (newCount >= 3) {
      setIsLockedOut(true);
      setWarningMessage('You have exited fullscreen 3 times. Your assessment will be automatically submitted.');
      setShowWarningModal(true);
      setTimeout(() => onLockout?.(), 3000);
    } else if (newCount === 2) {
      setWarningMessage(`Security breach ${newCount}/3: This is your FINAL warning! Exiting fullscreen one more time will automatically submit your assessment.`);
      setShowWarningModal(true);
      setShowFullscreenPrompt(true);
    } else {
      setWarningMessage(`Security breach ${newCount}/3: Exiting fullscreen has been logged. You have ${3 - newCount} warning(s) remaining before your assessment is automatically submitted.`);
      setShowWarningModal(true);
      setShowFullscreenPrompt(true);
    }
  };

  // ── Fullscreen change monitor ────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !fullscreenSupported) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      const wasFullscreen = isFullscreenRef.current;
      // Update synchronously so the next event in the same task sees the
      // correct value immediately.
      isFullscreenRef.current = isCurrentlyFullscreen;
      setIsFullscreen(isCurrentlyFullscreen);

      if (wasFullscreen && !isCurrentlyFullscreen && !isLockedOutRef.current) {
        // ① Entering guard — absorb browser transition artefacts.
        //    When requestFullscreen() is called, some browsers fire a brief
        //    ENTER → EXIT cycle as the OS window transitions.  The
        //    enteringFullscreenRef flag is held for POST_ENTRY_GRACE_MS after
        //    the promise resolves so all such artefacts are ignored.
        if (enteringFullscreenRef.current) return;

        // ② Debounce — absorb duplicate events for the same Escape press.
        const now = Date.now();
        if (now - lastExitTimeRef.current < EXIT_DEBOUNCE_MS) return;
        lastExitTimeRef.current = now;

        // Legitimate exit confirmed — count the breach and show warning/lockout.
        // We intentionally do NOT attempt automatic re-entry here: doing so fires
        // additional fullscreenchange events that (with precise timing) could feed
        // back into this handler and count as further breaches.  The warning
        // modal's "Return to Fullscreen" button provides reliable, user-gesture-
        // backed re-entry instead.
        handleFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [enabled, fullscreenSupported]);

  // ── Escape key logger ────────────────────────────────────────────────────
  // Intercept in capture phase so we can log the intent before the browser
  // exits fullscreen and fires fullscreenchange.
  useEffect(() => {
    if (!enabled || !fullscreenSupported) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreenRef.current && !isLockedOutRef.current) {
        axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
          event_type: 'escape_key_pressed_in_fullscreen'
        }).catch(() => {});
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [attemptId, enabled, fullscreenSupported]);

  // ── Focus / visibility monitor ───────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
          event_type: 'tab_hidden'
        }).catch(() => {});
      }
    };

    const handleBlur = () => {
      axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
        event_type: 'window_blur'
      }).catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attemptId, enabled]);

  // ── Dismiss warning modal ────────────────────────────────────────────────
  const dismissWarning = () => {
    setShowWarningModal(false);
    if (isFullscreenRef.current) {
      // The student is already in fullscreen (e.g. they re-entered via another
      // path).  Just clear the prompt overlay — calling enterFullscreen() again
      // would be a no-op at best and could fire extra fullscreenchange events.
      setShowFullscreenPrompt(false);
    } else {
      // Not in fullscreen — re-enter now.  This is called from a button click
      // so the user-gesture requirement for requestFullscreen() is met.
      enterFullscreen();
    }
  };

  return {
    isFullscreen,
    fullscreenSupported,
    showFullscreenPrompt,
    fullscreenExitCount,
    isLockedOut,
    showWarningModal,
    warningMessage,
    enterFullscreen,
    dismissWarning,
  };
};
