import { useEffect, useState } from 'react';
import { API_URL } from '@/config';

export function useBatchNav(batchId, submissionId) {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    if (!batchId) return;
    let cancelled = false;
    fetch(`${API_URL}/api/ocr/batches/${batchId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setSubs(d.submissions || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [batchId]);

  const idx = subs.findIndex((s) => s.id === submissionId);
  return {
    total: subs.length,
    position: idx + 1,
    prev: idx > 0 ? subs[idx - 1] : null,
    next: idx >= 0 && idx < subs.length - 1 ? subs[idx + 1] : null,
  };
}

// Already-approved scripts open in moderation, the rest in review.
export const scriptPath = (s, batchId) =>
  `/teacher/${['marked_draft', 'finalized'].includes(s.status) ? 'ocr-moderate' : 'ocr-review'}/${s.id}?batch=${batchId}`;