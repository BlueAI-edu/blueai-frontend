import { useState } from 'react';

const STATUS_STYLE = {
  complete:     { box: 'bg-green-50 border-green-300', text: 'text-green-800', label: 'Extraction complete' },
  needs_review: { box: 'bg-amber-50 border-amber-300', text: 'text-amber-800', label: 'Needs review' },
  failed:       { box: 'bg-red-50 border-red-300',     text: 'text-red-800',   label: 'Extraction incomplete' },
};

const pagesFor = (issues, doc) => {
  const set = new Set();
  (issues || []).forEach((i) => {
    if (i.document !== doc) return;
    if (i.page) set.add(i.page);
    (i.pages || []).forEach((p) => set.add(p));
  });
  return [...set].sort((a, b) => a - b);
};

/**
 * Shows the extraction validation report and the Reprocess actions.
 * Props:
 *  validation   – the `validation` object from the extract / reprocess response
 *  busy         – true while a reprocess request is running
 *  message      – optional result text from the last reprocess
 *  onReprocess  – (document: 'qp' | 'ms', pages: number[]) => void
 *  ackFailed    – checkbox state: teacher confirms they checked an incomplete paper by hand
 *  onAckChange  – (boolean) => void
 */
const ValidationPanel = ({ validation, busy, message, onReprocess, ackFailed, onAckChange }) => {
  const [showIssues, setShowIssues] = useState(false);
  if (!validation) return null;

  const style = STATUS_STYLE[validation.status] || STATUS_STYLE.needs_review;
  const s = validation.summary || {};
  const issues = validation.issues || [];
  const qpPages = pagesFor(issues, 'qp');
  const msPages = pagesFor(issues, 'ms');
  const errors = issues.filter((i) => i.severity === 'error').length;

  return (
    <div className={`rounded-lg border p-4 ${style.box}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${style.text}`}>
            {validation.status === 'complete' ? '✓ ' : '⚠ '}{style.label}
          </p>
          <p className="text-xs text-gray-700 mt-0.5">
            {s.questions_extracted ?? 0} questions · {s.marks_total ?? 0} marks
            {s.marks_declared ? ` (paper states ${s.marks_declared})` : ''} ·{' '}
            {s.ms_matched ?? 0} mark schemes matched
            {s.ms_approximate ? `, ${s.ms_approximate} approximate` : ''}
            {s.ms_not_found ? `, ${s.ms_not_found} not found` : ''}
            {s.ms_incomplete ? `, ${s.ms_incomplete} unresolved (failed pages)` : ''}
            {s.ms_orphans ? ` · ${s.ms_orphans} unmatched mark scheme entries` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {qpPages.length > 0 && (
            <button
              disabled={busy}
              onClick={() => onReprocess('qp', qpPages)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Reprocessing…' : `Reprocess question paper page${qpPages.length > 1 ? 's' : ''} ${qpPages.join(', ')}`}
            </button>
          )}
          {msPages.length > 0 && (
            <button
              disabled={busy}
              onClick={() => onReprocess('ms', msPages)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Reprocessing…' : `Reprocess mark scheme page${msPages.length > 1 ? 's' : ''} ${msPages.join(', ')}`}
            </button>
          )}
        </div>
      </div>

      {message && <p className="mt-2 text-xs text-gray-700">{message}</p>}

      {issues.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowIssues((v) => !v)}
            className="text-xs font-medium text-gray-700 underline"
          >
            {showIssues ? 'Hide' : 'Show'} {issues.length} issue{issues.length !== 1 ? 's' : ''}
            {errors > 0 ? ` (${errors} error${errors !== 1 ? 's' : ''})` : ''}
          </button>
          {showIssues && (
            <ul className="mt-2 space-y-1 max-h-56 overflow-y-auto">
              {issues.map((i, idx) => (
                <li key={idx} className="text-xs flex gap-2">
                  <span className={i.severity === 'error' ? 'text-red-600' : 'text-amber-600'}>
                    {i.severity === 'error' ? '✕' : '⚠'}
                  </span>
                  <span className="text-gray-800">{i.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {validation.status === 'failed' && (
        <label className="mt-3 flex items-start gap-2 text-xs text-red-800">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={!!ackFailed}
            onChange={(e) => onAckChange(e.target.checked)}
          />
          <span>
            Some pages could not be extracted. I have checked the original documents and will fill in
            anything missing by hand.
          </span>
        </label>
      )}
    </div>
  );
};

export default ValidationPanel;