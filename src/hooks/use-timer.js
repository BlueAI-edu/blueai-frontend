import { useState, useEffect } from 'react';

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const useTimer = ({ startedAt, durationMinutes, enabled = true, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!durationMinutes || !startedAt || !enabled) return;

    const startTime = new Date(startedAt).getTime();
    const duration = durationMinutes * 60 * 1000;
    const endTime = startTime + duration;

    // Initialize immediately
    const now = Date.now();
    const initialRemaining = endTime - now;
    if (initialRemaining > 0) {
      setTimeLeft(Math.floor(initialRemaining / 1000));
    } else {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        clearInterval(timer);
        onExpire?.();
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAt, durationMinutes, enabled]);

  return { timeLeft, formatTime };
};
