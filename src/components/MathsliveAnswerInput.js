import { useEffect, useRef, useCallback, useState } from 'react';
import 'mathlive';

/**
 * MathsliveAnswerInput with Text/Maths Toggle
 * 
 * **DEFAULTS TO TEXT MODE**
 * Math mode only activates on explicit user action (clicking "Maths" toggle).
 * 
 * This satisfies: "Math input mode only triggers on explicit user action (e.g. equation toggle), not by default"
 *
 * Props:
 *   value        : string  — LaTeX string (controlled)
 *   onChange     : (latex: string) => void
 *   questionType : 'NUMERIC' | 'EXPRESSION' | 'ALGEBRA'  (default: 'ALGEBRA')
 *   placeholder  : string
 *   className    : string
 *   inputRef     : ref forwarded from parent so keyboard panel can call insertSymbol
 */
const MathsliveAnswerInput = ({
  value = '',
  onChange,
  questionType = 'ALGEBRA',
  placeholder = 'Type your answer here…',
  className = '',
  inputRef: externalRef,
}) => {
  const internalRef = useRef(null);
  const mf = externalRef ?? internalRef;
  const [inputMode, setInputMode] = useState('text'); // DEFAULT: text mode
  const textareaRef = useRef(null);

  // ------------------------------------------------------------------
  // Sync controlled value into the appropriate input (text or math)
  // and auto-focus when switching to maths mode
  // ------------------------------------------------------------------
  useEffect(() => {
    if (inputMode === 'maths') {
      const el = mf.current;
      if (!el) return;
      if (el.getValue('latex') !== value) {
        el.setValue(value, { suppressChangeNotifications: true });
      }
      // Auto-focus when switching to maths mode
      setTimeout(() => el.focus(), 0);
    }
  }, [value, inputMode, mf]);

  // ------------------------------------------------------------------
  // Configure math-field after mount (only used in maths mode)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (inputMode !== 'maths') return; // Only setup when in maths mode
    
    let onKeyDown;
    
    // Delay to ensure math-field is fully rendered
    const timer = setTimeout(() => {
      const el = mf.current;
      if (!el) return;

      // Virtual keyboard policy
      el.mathVirtualKeyboardPolicy = questionType === 'NUMERIC' ? 'off' : 'auto';

      // Shift+Enter → LaTeX newline \\
      onKeyDown = (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          el.executeCommand(['insert', '\\\\']);
        }
      };
      el.addEventListener('keydown', onKeyDown);
    }, 50);
    
    // Cleanup
    return () => {
      clearTimeout(timer);
      const el = mf.current;
      if (el && onKeyDown) {
        el.removeEventListener('keydown', onKeyDown);
      }
    };
  }, [questionType, inputMode, mf]);

  // ------------------------------------------------------------------
  // Expose insertSymbol on the DOM element (for keyboard panel)
  // ------------------------------------------------------------------
  useEffect(() => {
    const el = mf.current;
    if (!el) return;

    el.insertSymbol = (latexCmd) => {
      el.focus();
      el.executeCommand(['insert', latexCmd]);
      onChange?.(el.getValue('latex'));
    };
  }, [mf, onChange]);

  // ------------------------------------------------------------------
  // onChange handlers
  // ------------------------------------------------------------------
  const handleTextChange = useCallback(
    (e) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  const handleTextKeyDown = useCallback(
    (e) => {
      // Shift+Enter creates a new line in text mode
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textBefore = value.substring(0, start);
        const textAfter = value.substring(end);
        const newValue = textBefore + '\n' + textAfter;
        
        onChange?.(newValue);
        
        // Move cursor after the newline
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 1, start + 1);
        }, 0);
      }
    },
    [value, onChange]
  );

  const handleMathInput = useCallback(
    (e) => {
      onChange?.(e.target.getValue('latex'));
    },
    [onChange]
  );

  // ------------------------------------------------------------------
  // Help text per mode
  // ------------------------------------------------------------------
  const textModeHint = {
    NUMERIC: 'Type numbers and decimals (e.g. 42, 3.14). Press Shift+Enter for new line.',
    EXPRESSION: 'Type your answer. Switch to Maths mode for fractions and symbols. Press Shift+Enter for new line.',
    ALGEBRA: 'Type your answer. Switch to Maths mode for equations and symbols. Press Shift+Enter for new line.',
  };

  const mathsModeHint = {
    NUMERIC: 'Numbers and decimals only (e.g. 42, 3.14). Press Shift+Enter for new line.',
    EXPRESSION: 'Use ^ for powers, / for fractions (e.g. 2x + 3/4). Press Shift+Enter for new line.',
    ALGEBRA: 'Full math input: fractions, roots, Greek symbols (e.g. √2, π). Press Shift+Enter for new line.',
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mode Toggle: Text / Maths */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setInputMode('text')}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            inputMode === 'text'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Switch to plain text mode"
        >
          Text
        </button>
        <button
          onClick={() => setInputMode('maths')}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            inputMode === 'maths'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Switch to math input mode"
        >
          Maths
        </button>
      </div>

      {/* Text Mode: Plain Textarea (DEFAULT) */}
      {inputMode === 'text' && (
        <>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyDown}
            placeholder={placeholder}
            rows={6}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 font-sans"
            style={{
              fontSize: '1rem',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
            data-testid={`text-mode-${questionType}`}
          />
          {textModeHint[questionType] && (
            <p className="text-xs text-gray-500">{textModeHint[questionType]}</p>
          )}
        </>
      )}

      {/* Maths Mode: MathLive Field (ONLY ON EXPLICIT USER ACTION) */}
      {inputMode === 'maths' && (
        <>
          <math-field
            ref={mf}
            placeholder={placeholder}
            onInput={handleMathInput}
            style={{
              width: '100%',
              fontSize: '1rem',
              padding: '0.75rem 1rem',
              border: '2px solid #d1d5db',
              borderRadius: '0.5rem',
              display: 'block',
            }}
            data-testid={`math-mode-${questionType}`}
          />
          {mathsModeHint[questionType] && (
            <p className="text-xs text-gray-500">{mathsModeHint[questionType]}</p>
          )}
        </>
      )}
    </div>
  );
};

export default MathsliveAnswerInput;