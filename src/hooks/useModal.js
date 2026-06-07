import { useState, useCallback } from 'react';

/**
 * Minimal modal state manager.
 *
 * Usage:
 *   const { isOpen, open, close, toggle } = useModal();
 *   const { isOpen, open, close } = useModal(true); // open by default
 */
export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle };
}
