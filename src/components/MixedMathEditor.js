import React, { useRef, useState, useEffect } from 'react';
import 'mathlive';
import LaTeXRenderer from './LaTeXRenderer';

/**
 * MixedMathEditor
 * A textarea for prose combined with a MathLive WYSIWYG equation bar.
 * Teachers type text normally; when they need a math expression they click
 * "∑ Equation", type into the visual MathLive field (equations render live
 * exactly like Desmos), then click "Insert" to drop it at cursor position.
 * A KaTeX preview below shows the final rendered output.
 */
const MixedMathEditor = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  'data-testid': testId,
}) => {
  const textareaRef = useRef(null);
  const mathFieldRef = useRef(null);
  const [showMathBar, setShowMathBar] = useState(false);
  const [mathIsEmpty, setMathIsEmpty] = useState(true);
  const [cursorPos, setCursorPos] = useState(null);

  // Set up MathLive field whenever the bar opens
  useEffect(() => {
    if (!showMathBar) return;

    let handler;

    const setup = () => {
      const mf = mathFieldRef.current;
      if (!mf) return;
      // Disable bottom-of-screen virtual keyboard
      mf.mathVirtualKeyboardPolicy = 'manual';
      // Reset on open
      mf.value = '';
      setMathIsEmpty(true);

      handler = () => setMathIsEmpty(!mf.value || mf.value.trim() === '');
      mf.addEventListener('input', handler);

      setTimeout(() => { try { mf.focus(); } catch (_) {} }, 60);
    };

    if (customElements.get('math-field')) {
      setup();
    } else {
      const t = setTimeout(setup, 120);
      return () => clearTimeout(t);
    }

    return () => {
      const mf = mathFieldRef.current;
      if (mf && handler) mf.removeEventListener('input', handler);
    };
  }, [showMathBar]);

  const saveCursor = () => {
    if (textareaRef.current) setCursorPos(textareaRef.current.selectionStart);
  };

  const openMathBar = () => {
    saveCursor();
    setShowMathBar(true);
  };

  const closeMathBar = () => {
    setShowMathBar(false);
    textareaRef.current?.focus();
  };

  const insertEquation = () => {
    const mf = mathFieldRef.current;
    const latex = mf?.value?.trim() || '';
    if (!latex) return;

    const snippet = `$${latex}$ `;
    const pos = cursorPos ?? (value || '').length;
    const before = (value || '').slice(0, pos);
    const after = (value || '').slice(pos);
    // Add a space before the snippet only if the char before cursor isn't already a space
    const sep = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const newValue = before + sep + snippet + after;
    onChange(newValue);

    setShowMathBar(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = pos + sep.length + snippet.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
      }
    }, 30);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') insertEquation();
    if (e.key === 'Escape') closeMathBar();
  };

  const hasPreview = value && value.includes('$');

  return (
    <div className="space-y-1.5">
      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={saveCursor}
          onKeyUp={saveCursor}
          onClick={saveCursor}
          placeholder={placeholder}
          rows={rows}
          required={required}
          data-testid={testId}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y pr-28 text-sm"
        />
        <button
          type="button"
          onClick={openMathBar}
          className={`absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
            showMathBar
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
          }`}
        >
          ∑ Equation
        </button>
      </div>

      {/* Inline WYSIWYG math bar */}
      {showMathBar && (
        <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-3 space-y-2" onKeyDown={handleKeyDown}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">
              Type your equation — it renders as you type
            </span>
            <span className="text-xs text-blue-500">
              Try: <code className="bg-blue-100 px-1 rounded">x^2</code>&nbsp;
              <code className="bg-blue-100 px-1 rounded">a//b</code>&nbsp;
              <code className="bg-blue-100 px-1 rounded">sqrt</code>&nbsp;
              <code className="bg-blue-100 px-1 rounded">pi</code>
            </span>
          </div>

          {/* MathLive field */}
          <div className="flex gap-2 items-stretch">
            <div
              className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 cursor-text flex items-center min-h-[52px]"
              onClick={() => mathFieldRef.current?.focus()}
            >
              <math-field
                ref={mathFieldRef}
                style={{
                  width: '100%',
                  fontSize: '1.5rem',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={insertEquation}
                disabled={mathIsEmpty}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-1"
                title="Ctrl+Enter"
              >
                Insert ↑
              </button>
              <button
                type="button"
                onClick={closeMathBar}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg text-sm hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>

          <p className="text-xs text-blue-400">Ctrl+Enter to insert · Esc to close</p>
        </div>
      )}

      {/* Live rendered preview */}
      {hasPreview && (
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-400 font-medium mb-1">Preview</p>
          <div className="text-sm text-gray-900">
            <LaTeXRenderer text={value} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MixedMathEditor;
