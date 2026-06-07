import { useEffect, useRef, useState } from 'react';
import 'mathlive';

const SHORTCUTS = [
  { key: '//', label: 'Fraction', example: 'a//b → a/b' },
  { key: '^', label: 'Power', example: 'x^2 → x²' },
  { key: '_', label: 'Subscript', example: 'x_1 → x₁' },
  { key: 'sqrt', label: 'Square root', example: 'sqrt → √' },
  { key: 'pi', label: 'Pi', example: 'pi → π' },
  { key: 'inf', label: 'Infinity', example: 'inf → ∞' },
];

const MathEquationEditor = ({ onInsert, onClose }) => {
  const mathFieldRef = useRef(null);
  const [displayMode, setDisplayMode] = useState('inline');
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const mf = mathFieldRef.current;
    if (!mf) return;

    const init = () => {
      // Disable the global virtual keyboard (appears at bottom of screen by default)
      mf.mathVirtualKeyboardPolicy = 'manual';

      const handleInput = () => {
        setIsEmpty(!mf.value || mf.value.trim() === '');
      };
      mf.addEventListener('input', handleInput);

      try { mf.focus(); } catch (_) {}

      return handleInput;
    };

    // Delay until the web component is fully defined and upgraded
    let handleInput;
    if (customElements.get('math-field')) {
      handleInput = init();
    } else {
      const timer = setTimeout(() => {
        handleInput = init();
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (handleInput) mf.removeEventListener('input', handleInput);
    };
  }, []);

  const handleInsert = () => {
    const mf = mathFieldRef.current;
    const latex = mf?.value || '';
    if (!latex.trim()) return;
    const wrapped = displayMode === 'display' ? `$$${latex}$$` : `$${latex}$`;
    onInsert(wrapped);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleInsert();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Insert Equation</h3>
            <p className="text-xs text-gray-500 mt-0.5">Type your equation — it renders as you type</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Math field */}
        <div className="px-6 pt-5 pb-3">
          <div className="border-2 border-blue-400 rounded-xl p-4 bg-blue-50 min-h-[80px] flex items-center cursor-text"
            onClick={() => mathFieldRef.current?.focus()}
          >
            <math-field
              ref={mathFieldRef}
              style={{
                width: '100%',
                fontSize: '1.6rem',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
          </div>
          {isEmpty && (
            <p className="text-xs text-blue-500 mt-1 pl-1">
              Click here and start typing your equation (e.g. type <code className="bg-blue-100 px-1 rounded">x^2+2x+1</code>)
            </p>
          )}
        </div>

        {/* Display mode */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Style:</span>
          <button
            onClick={() => setDisplayMode('inline')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              displayMode === 'inline'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            Inline
          </button>
          <button
            onClick={() => setDisplayMode('display')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              displayMode === 'display'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            Centred / Large
          </button>
        </div>

        {/* Shortcut hints */}
        <div className="mx-6 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-2">Shortcuts</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {SHORTCUTS.map((s) => (
              <div key={s.key} className="text-xs text-gray-600">
                <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">{s.example}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
          <span className="text-xs text-gray-400">Ctrl+Enter to insert</span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={isEmpty}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Insert Equation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathEquationEditor;
