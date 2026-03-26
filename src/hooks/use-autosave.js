import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '@/config';

export const useAutosave = ({ attemptId, data, endpoint, enabled = true, mode = 'interval', delay = 15000 }) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const dataRef = useRef(data);
  const isSavingRef = useRef(false);

  // Keep data ref current to avoid stale closures
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!attemptId || !enabled) return;

    const save = async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        const response = await axios.post(`${API}${endpoint}`, dataRef.current);
        if (response.data.success !== false) {
          setLastSaved(new Date().toLocaleTimeString());
        }
      } catch (error) {
        // Silently ignore autosave failures
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    };

    if (mode === 'interval') {
      const interval = setInterval(save, delay);
      return () => clearInterval(interval);
    }
    // debounce mode handled below
  }, [attemptId, enabled, endpoint, mode, delay]);

  // Debounce mode: trigger save after `delay` ms of data inactivity
  useEffect(() => {
    if (mode !== 'debounce' || !attemptId || !enabled) return;

    const save = async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        await axios.post(`${API}${endpoint}`, dataRef.current);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (error) {
        // Silently ignore autosave failures
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    };

    const timer = setTimeout(save, delay);
    return () => clearTimeout(timer);
  }, [data, mode, attemptId, enabled, endpoint, delay]);

  return { lastSaved, isSaving };
};
