import { useRef, useState, useEffect } from 'react';
import 'mathlive';
import LaTeXRenderer from './LaTeXRenderer';
import MathKeyboard from './MathKeyboard';

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
  const [showSymbols, setShowSymbols] = useState(false);
  const [mathIsEmpty, setMathIsEmpty] = useState(true);
  const [cursorPos, setCursorPos] = useState(null);

  useEffect(() => {
    if (!showMathBar) return;

    let handler;
    const setup = () => {
      const mf = mathFieldRef.current;
      if (!mf) return;

      // Suppress MathLive's virtual keyboard entirely — we rely on physical keyboard only
      mf.mathVirtualKeyboardPolicy = 'manual';
      try { window.mathVirtualKeyboard?.hide(); } catch (_) {}

      mf.value = '';
      setMathIsEmpty(true);
      handler = () => setMathIsEmpty(!mf.value || mf.value.trim() === '');
      mf.addEventListener('input', handler);

      // Also hide on focus in case the browser triggers it
      const onFocus = () => { try { window.mathVirtualKeyboard?.hide(); } catch (_) {} };
      mf.addEventListener('focusin', onFocus);

      setTimeout(() => { try { mf.focus(); } catch (_) {} }, 60);

      // Return cleanup that removes both listeners
      const origHandler = handler;
      handler = () => {
        origHandler();
      };
      mf._mixedEditorFocusHandler = onFocus;
    };

    if (customElements.get('math-field')) {
      setup();
    } else {
      const t = setTimeout(setup, 120);
      return () => clearTimeout(t);
    }

    return () => {
      const mf = mathFieldRef.current;
      if (!mf) return;
      if (handler) mf.removeEventListener('input', handler);
      if (mf._mixedEditorFocusHandler) {
        mf.removeEventListener('focusin', mf._mixedEditorFocusHandler);
        delete mf._mixedEditorFocusHandler;
      }
    };
  }, [showMathBar]);

  const saveCursor = () => {
    if (textareaRef.current) setCursorPos(textareaRef.current.selectionStart);
  };

  const insertAtCursor = (snippet) => {
    const pos = cursorPos ?? (value || '').length;
    const before = (value || '').slice(0, pos);
    const after = (value || '').slice(pos);
    const sep = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const newValue = before + sep + snippet + after;
    onChange(newValue);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = pos + sep.length + snippet.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
      }
    }, 30);
  };

  const insertEquation = () => {
    const mf = mathFieldRef.current;
    const latex = mf?.value?.trim() || '';
    if (!latex) return;
    insertAtCursor(`$${latex}$ `);
    try { window.mathVirtualKeyboard?.hide(); } catch (_) {}
    try { mf?.blur(); } catch (_) {}
    setShowMathBar(false);
  };

  const insertSymbol = (latex) => {
    // latex already arrives wrapped as $...$ from MathKeyboard
    insertAtCursor(latex + ' ');
    setShowSymbols(false);
  };

  const closeMathBar = () => {
    // Explicitly dismiss MathLive's virtual keyboard before unmounting the field
    try { window.mathVirtualKeyboard?.hide(); } catch (_) {}
    try { mathFieldRef.current?.blur(); } catch (_) {}
    setShowMathBar(false);
    textareaRef.current?.focus();
  };

  const handleMathBarKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') insertEquation();
    if (e.key === 'Escape') closeMathBar();
  };

  const openMathBar = () => {
    saveCursor();
    setShowMathBar(true);
    setShowSymbols(false);
  };

  const openSymbols = () => {
    saveCursor();
    setShowSymbols(true);
  };

  const hasPreview = value && value.includes('$');

  return (
    <div className="space-y-1.5">
      {/* Textarea with button toolbar */}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y pr-44 text-sm"
        />
        {/* Two buttons top-right inside the textarea */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            type="button"
            onClick={openMathBar}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
              showMathBar
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
            }`}
            title="Insert rendered equation (WYSIWYG)"
          >
            ∑ Equation
          </button>
          <button
            type="button"
            onClick={openSymbols}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
            title="Insert symbol (Greek, Chemistry, Vectors…)"
          >
            αβ Symbols
          </button>
        </div>
      </div>

      {/* Inline WYSIWYG equation bar */}
      {showMathBar && (
        <div
          className="rounded-xl border-2 border-blue-400 bg-blue-50 p-3 space-y-2"
          onKeyDown={handleMathBarKeyDown}
        >
          {/* Bar header with close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-blue-700">
                Type your equation — it renders as you type
              </span>
              <span className="text-xs text-blue-400 hidden sm:block">
                Try:&nbsp;
                <code className="bg-blue-100 px-1 rounded">x^2</code>&nbsp;
                <code className="bg-blue-100 px-1 rounded">a//b</code>&nbsp;
                <code className="bg-blue-100 px-1 rounded">sqrt</code>&nbsp;
                <code className="bg-blue-100 px-1 rounded">pi</code>
              </span>
            </div>
            <button
              type="button"
              onClick={closeMathBar}
              className="ml-2 p-1 rounded-full text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0"
              title="Close equation bar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* MathLive field + Insert button */}
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
            <button
              type="button"
              onClick={insertEquation}
              disabled={mathIsEmpty}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap self-stretch"
              title="Insert equation (Ctrl+Enter)"
            >
              Insert ↑
            </button>
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

      {/* Symbols modal (Greek, Chemistry, Vectors, etc.) */}
      {showSymbols && (
        <MathKeyboard
          onInsert={insertSymbol}
          onClose={() => setShowSymbols(false)}
        />
      )}
    </div>
  );
};

export default MixedMathEditor;
