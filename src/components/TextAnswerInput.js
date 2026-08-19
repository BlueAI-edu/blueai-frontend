import { useCallback } from 'react';

/**
 * TextAnswerInput
 * Plain textarea for free-text answers (no math rendering).
 * Used for TEXT, SHORT_ANSWER, LONG_ANSWER, SHORT_RESPONSE, LONG_RESPONSE question types.
 *
 * Props:
 *   value        : string
 *   onChange     : (text: string) => void
 *   placeholder  : string
 *   className    : string
 *   inputRef     : ref (optional, for parent control)
 *   rows         : number (default: 6)
 */
const TextAnswerInput = ({
  value = '',
  onChange,
  placeholder = 'Type your answer here…',
  className = '',
  inputRef,
  rows = 6,
}) => {
  const handleChange = useCallback(
    (e) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  return (
    <textarea
      ref={inputRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 font-sans ${className}`}
      style={{
        fontSize: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      data-testid="text-answer-input"
    />
  );
};

export default TextAnswerInput;