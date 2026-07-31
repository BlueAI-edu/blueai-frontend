import { useEffect, useRef, useCallback } from 'react';
import 'mathlive';

/**
 * MathsliveAnswerInput
 *
 * Pure Mathslive <math-field> input. No textarea, no preview.
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

  // ------------------------------------------------------------------
  // Sync controlled value into math-field when changed externally
  // ------------------------------------------------------------------
  useEffect(() => {
    const el = mf.current;
    if (!el) return;
    if (el.getValue('latex') !== value) {
      el.setValue(value, { suppressChangeNotifications: true });
    }
  }, [value, mf]);

  // ------------------------------------------------------------------
  // Configure math-field after mount
  // ------------------------------------------------------------------
  useEffect(() => {
    const el = mf.current;
    if (!el) return;

    // Virtual keyboard policy
    el.mathVirtualKeyboardPolicy = questionType === 'NUMERIC' ? 'off' : 'auto';

    // Shift+Enter → LaTeX newline \\
    const onKeyDown = (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        el.executeCommand(['insert', '\\\\']);
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [questionType, mf]);

  // ------------------------------------------------------------------
  // Expose insertSymbol on the DOM element so keyboard panel can call it:
  //   mathfieldRef.current.insertSymbol('\\sqrt{}')
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
  // onChange handler
  // ------------------------------------------------------------------
  const handleInput = useCallback(
    (e) => {
      onChange?.(e.target.getValue('latex'));
    },
    [onChange]
  );

  // ------------------------------------------------------------------
  // Hint text per question type
  // ------------------------------------------------------------------
  const hints = {
    NUMERIC: 'Numbers and decimals only (e.g. 42, 3.14)',
    EXPRESSION: 'Use ^ for powers, / for fractions (e.g. 2x + 3/4)',
    ALGEBRA: 'Full math input: fractions, roots, Greek symbols (e.g. √2, π)',
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <math-field
        ref={mf}
        placeholder={placeholder}
        onInput={handleInput}
        style={{
          width: '100%',
          fontSize: '1rem',
          padding: '0.75rem 1rem',
          border: '2px solid #d1d5db',
          borderRadius: '0.5rem',
          display: 'block',
        }}
      />
      {hints[questionType] && (
        <p className="text-xs text-gray-500">{hints[questionType]}</p>
      )}
    </div>
  );
};

export default MathsliveAnswerInput;