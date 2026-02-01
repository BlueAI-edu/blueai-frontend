import React, { useState, useEffect, useRef } from 'react';
import StudentMathKeyboard from './StudentMathKeyboard';
import StudentCalculator from './StudentCalculator';
import LaTeXRenderer from './LaTeXRenderer';
import ShowWorkingScratchpad from './ShowWorkingScratchpad';

const StudentMathInput = ({
  questionId,
  answerType = 'text',
  value = '',
  onChange,
  calculatorAllowed = false,
  scientificCalculatorAllowed = false,
  placeholder = 'Type your answer here...',
  showWorkingValue = '',
  onShowWorkingChange = null,
  enableScratchpad = true
}) => {
  const [inputMode, setInputMode] = useState('text'); // text or maths
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // Auto-detect if answer contains LaTeX and switch to maths mode
  useEffect(() => {
    if (value && value.includes('$') && answerType !== 'text') {
      setInputMode('maths');
    }
  }, [value, answerType]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart);
  };

  const insertSymbol = (symbol, cursorOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);

    const newValue = textBefore + symbol + textAfter;
    onChange(newValue);

    // Set cursor position after insertion
    setTimeout(() => {
      const newPosition = start + symbol.length + (cursorOffset || 0);
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const toggleMode = () => {
    if (answerType === 'text') return; // Can't switch modes for text-only questions
    setInputMode(inputMode === 'text' ? 'maths' : 'text');
  };

  const clearAnswer = () => {
    if (window.confirm('Clear your answer?')) {
      onChange('');
    }
  };

  // Determine if maths mode is available
  const mathsAvailable = answerType === 'maths' || answerType === 'mixed' || answerType === 'numeric';

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Mode Toggle (if available) */}
          {mathsAvailable && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setInputMode('text')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  inputMode === 'text'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setInputMode('maths')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  inputMode === 'maths'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Maths
              </button>
            </div>
          )}

          {/* Answer Type Badge */}
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
            {answerType === 'text' && '📝 Text'}
            {answerType === 'maths' && '🔢 Maths'}
            {answerType === 'mixed' && '📐 Mixed'}
            {answerType === 'numeric' && '🔢 Numeric'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Math Keyboard Toggle */}
          {mathsAvailable && inputMode === 'maths' && (
            <button
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={`px-3 py-1 text-sm font-medium rounded border ${
                showKeyboard
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Toggle maths keyboard"
            >
              🔢 Keyboard
            </button>
          )}

          {/* Calculator Toggle */}
          {calculatorAllowed && (
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className={`px-3 py-1 text-sm font-medium rounded border ${
                showCalculator
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Toggle calculator"
            >
              🧮 Calculator
            </button>
          )}

          {/* Clear Button */}
          {value && (
            <button
              onClick={clearAnswer}
              className="px-3 py-1 text-sm font-medium rounded border bg-white border-gray-300 text-red-600 hover:bg-red-50"
              title="Clear answer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-2 border-gray-300 rounded-lg focus-within:border-blue-500 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          placeholder={
            inputMode === 'maths'
              ? 'Type your answer. Use $ for maths symbols (e.g., $x^2$)'
              : placeholder
          }
          className="w-full px-4 py-3 rounded-lg resize-none focus:outline-none min-h-[120px] font-mono"
          data-testid={`answer-input-${questionId}`}
        />
      </div>

      {/* Live Preview (for maths mode) */}
      {mathsAvailable && inputMode === 'maths' && value && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-blue-900">Preview:</p>
            <span className="text-xs text-blue-700">This is how your answer will appear</span>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200 min-h-[60px]">
            <LaTeXRenderer text={value} />
          </div>
        </div>
      )}

      {/* Maths Keyboard */}
      {showKeyboard && mathsAvailable && inputMode === 'maths' && (
        <div className="animate-slideDown">
          <StudentMathKeyboard
            onInsert={insertSymbol}
            onClose={() => setShowKeyboard(false)}
          />
        </div>
      )}

      {/* Calculator */}
      {showCalculator && calculatorAllowed && (
        <div className="animate-slideDown">
          <StudentCalculator
            mode={scientificCalculatorAllowed ? 'scientific' : 'basic'}
            onClose={() => setShowCalculator(false)}
          />
        </div>
      )}

      {/* Help Text */}
      {mathsAvailable && inputMode === 'maths' && (
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Quick tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use $ for inline maths: <code className="bg-white px-1 rounded">$x^2$</code> displays as x²</li>
            <li>Use the keyboard below for symbols and fractions</li>
            <li>Your answer will be marked as shown in the preview</li>
            {calculatorAllowed && <li>Use the calculator for calculations, but show your working!</li>}
          </ul>
        </div>
      )}

      {/* Show Working Scratchpad */}
      {enableScratchpad && onShowWorkingChange && (
        <div className="mt-4">
          <ShowWorkingScratchpad
            questionId={questionId}
            initialValue={showWorkingValue}
            onChange={onShowWorkingChange}
          />
        </div>
      )}
    </div>
  );
};

export default StudentMathInput;
