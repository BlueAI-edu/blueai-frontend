import React, { useState, useEffect } from 'react';
import LaTeXRenderer from './LaTeXRenderer';
import StudentMathKeyboard from './StudentMathKeyboard';

const ShowWorkingScratchpad = ({ 
  questionId, 
  initialValue = '', 
  onChange,
  readOnly = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [workingText, setWorkingText] = useState(initialValue);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const textareaRef = React.useRef(null);

  useEffect(() => {
    // Auto-save working after 2 seconds of no typing
    const timer = setTimeout(() => {
      if (workingText !== initialValue) {
        onChange(workingText);
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [workingText, onChange, initialValue]);

  const insertSymbol = (symbol, cursorOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = workingText.substring(0, start);
    const textAfter = workingText.substring(end);

    const newValue = textBefore + symbol + textAfter;
    setWorkingText(newValue);

    setTimeout(() => {
      const newPosition = start + symbol.length + (cursorOffset || 0);
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const clearWorking = () => {
    if (window.confirm('Clear all working?')) {
      setWorkingText('');
      onChange('');
    }
  };

  const addSection = (label) => {
    const sections = {
      'step': '\n\n**Step X:**\n',
      'given': '\n\n**Given:**\n',
      'working': '\n\n**Working:**\n',
      'answer': '\n\n**Answer:**\n'
    };
    
    const newText = workingText + (sections[label] || '\n\n');
    setWorkingText(newText);
  };

  if (readOnly) {
    return (
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Working Shown:</h4>
        <div className="prose prose-sm max-w-none">
          <LaTeXRenderer text={workingText || 'No working shown'} />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <span className="font-medium text-gray-900">Show Your Working</span>
          {workingText && !isExpanded && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {workingText.length} characters
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && isExpanded && (
            <span className="text-xs text-green-600">✓ Saved {lastSaved}</span>
          )}
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white border-t">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Show your working to get partial credit even if your final answer isn't perfect!
              You can use math symbols and LaTeX formatting here too.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              onClick={() => addSection('step')}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
            >
              + Step
            </button>
            <button
              onClick={() => addSection('given')}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
            >
              + Given
            </button>
            <button
              onClick={() => addSection('working')}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
            >
              + Working
            </button>
            <button
              onClick={() => addSection('answer')}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
            >
              + Answer
            </button>
            <div className="flex-1"></div>
            <button
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={`text-xs px-3 py-1 rounded border ${
                showKeyboard
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔢 Symbols
            </button>
            {workingText && (
              <button
                onClick={clearWorking}
                className="text-xs px-3 py-1 bg-white hover:bg-red-50 rounded border border-gray-300 text-red-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Working Input */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Side */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type your working:
              </label>
              <textarea
                ref={textareaRef}
                value={workingText}
                onChange={(e) => setWorkingText(e.target.value)}
                placeholder="Show your steps, formulas, and calculations here...

Example:
Given: x + 5 = 15
Working: x = 15 - 5
Answer: x = 10

Use $ for maths: $x^2 + 3x - 10 = 0$"
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                data-testid={`working-input-${questionId}`}
              />
            </div>

            {/* Preview Side */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Preview (how it will appear):
              </label>
              <div className="h-64 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
                {workingText ? (
                  <LaTeXRenderer text={workingText} />
                ) : (
                  <p className="text-gray-400 text-sm">Your working preview will appear here...</p>
                )}
              </div>
            </div>
          </div>

          {/* Math Keyboard */}
          {showKeyboard && (
            <div className="mt-4 animate-slideDown">
              <StudentMathKeyboard
                onInsert={insertSymbol}
                onClose={() => setShowKeyboard(false)}
              />
            </div>
          )}

          {/* Help Text */}
          <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">Marking Guide:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Show each step clearly - you can earn marks even if your final answer is wrong</li>
              <li>Write formulas before substituting numbers</li>
              <li>Use the section buttons to organize your work</li>
              <li>Check your units and significant figures</li>
              <li>Use math symbols ($x^2$) for better clarity</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowWorkingScratchpad;
