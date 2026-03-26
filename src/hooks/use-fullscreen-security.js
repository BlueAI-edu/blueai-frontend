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
      event_type: 'fullscreen_exit',
      exit_count: newCount
    }).catch(() => {});

    if (newCount >= 3) {
      setIsLockedOut(true);
      setWarningMessage('You have exited fullscreen 3 times. Your assessment will be automatically submitted.');
      setShowWarningModal(true);
      setTimeout(() => onLockout?.(), 3000);
    } else if (newCount === 2) {
      setWarningMessage(`Warning ${newCount}/3: This is your FINAL warning! Exiting fullscreen one more time will automatically submit your assessment and log you out.`);
      setShowWarningModal(true);
      setShowFullscreenPrompt(true);
    } else {
      setWarningMessage(`Warning ${newCount}/3: You have exited fullscreen mode. This has been logged. You have ${3 - newCount} warning(s) remaining before automatic submission.`);
      setShowWarningModal(true);
      setShowFullscreenPrompt(true);
    }
  };

  // Monitor fullscreen changes
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
    enterFullscreen();
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
