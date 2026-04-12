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

  const isFullscreenRef = useRef(false);
  const isLockedOutRef = useRef(false);
  const exitCountRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { isFullscreenRef.current = isFullscreen; }, [isFullscreen]);
  useEffect(() => { isLockedOutRef.current = isLockedOut; }, [isLockedOut]);
  useEffect(() => { exitCountRef.current = fullscreenExitCount; }, [fullscreenExitCount]);

  // Check fullscreen support
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

  const enterFullscreen = async () => {
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
    }
  };

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

  // Monitor fullscreen changes — attempt immediate re-entry on every exit
  useEffect(() => {
    if (!enabled || !fullscreenSupported) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      const wasFullscreen = isFullscreenRef.current;
      setIsFullscreen(isCurrentlyFullscreen);

      if (wasFullscreen && !isCurrentlyFullscreen && !isLockedOutRef.current) {
        // Immediately attempt to re-enter fullscreen. The Escape key press is a
        // user-gesture context in Chromium/Firefox, so this often succeeds without
        // requiring an additional click. If it fails, the overlay forces the student
        // to manually click "Return to Fullscreen".
        const elem = document.documentElement;
        const reenter = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
        if (reenter) {
          reenter.call(elem).catch(() => {
            // Could not re-enter automatically — overlay will prompt the student
          });
        }
        // Always log the breach and show the warning regardless of re-entry outcome
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

  // Intercept Escape key in capture phase — fires before the browser exits fullscreen,
  // giving us the earliest possible chance to log the attempt.
  useEffect(() => {
    if (!enabled || !fullscreenSupported) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreenRef.current && !isLockedOutRef.current) {
        // Log the attempt immediately — the browser will still exit fullscreen,
        // but this records the intent before the fullscreenchange event fires.
        axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
          event_type: 'escape_key_pressed_in_fullscreen'
        }).catch(() => {});
      }
    };

    // capture: true ensures we receive this before React's synthetic event handlers
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [attemptId, enabled, fullscreenSupported]);

  // Focus loss monitoring
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

  const dismissWarning = () => {
    setShowWarningModal(false);
    // Only request fullscreen if not already in fullscreen (immediate re-entry may have worked)
    if (!isFullscreenRef.current) {
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
