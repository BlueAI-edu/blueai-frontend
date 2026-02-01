import React, { useState } from 'react';

const StudentMathKeyboard = ({ onInsert, onClose, compact = false }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [recentSymbols, setRecentSymbols] = useState([]);

  const addToRecent = (symbol) => {
    const newRecent = [symbol, ...recentSymbols.filter(s => s.value !== symbol.value)].slice(0, 12);
    setRecentSymbols(newRecent);
  };

  const handleInsert = (symbol) => {
    addToRecent(symbol);
    onInsert(symbol);
  };

  const mathSymbols = {
    basic: [
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '÷', value: '\\div', latex: true },
      { label: '(', value: '(' },
      { label: ')', value: ')' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '×', value: '\\times', latex: true },
      { label: '+', value: '+' },
      { label: '−', value: '-' },
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '=', value: '=' },
      { label: '<', value: '<' },
      { label: '>', value: '>' },
      { label: '0', value: '0' },
      { label: '.', value: '.' },
      { label: '±', value: '\\pm', latex: true },
      { label: '≠', value: '\\neq', latex: true },
      { label: '≤', value: '\\le', latex: true },
      { label: '≥', value: '\\ge', latex: true }
    ],
    algebra: [
      { label: 'x', value: 'x' },
      { label: 'y', value: 'y' },
      { label: 'z', value: 'z' },
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' },
      { label: 'c', value: 'c' },
      { label: 'x²', value: '^2', latex: true },
      { label: 'xⁿ', value: '^{}', latex: true, cursor: -1 },
      { label: 'x₁', value: '_1', latex: true },
      { label: 'xₙ', value: '_{}', latex: true, cursor: -1 },
      { label: '√', value: '\\sqrt{}', latex: true, cursor: -1 },
      { label: '∛', value: '\\sqrt[3]{}', latex: true, cursor: -1 },
      { label: 'a/b', value: '\\frac{}{}', latex: true, cursor: -3 },
      { label: '|x|', value: '|{}|', cursor: -2 },
      { label: '∞', value: '\\infty', latex: true },
      { label: '∑', value: '\\sum', latex: true }
    ],
    trig: [
      { label: 'sin', value: '\\sin(' },
      { label: 'cos', value: '\\cos(' },
      { label: 'tan', value: '\\tan(' },
      { label: 'sin⁻¹', value: '\\sin^{-1}(' },
      { label: 'cos⁻¹', value: '\\cos^{-1}(' },
      { label: 'tan⁻¹', value: '\\tan^{-1}(' },
      { label: 'π', value: '\\pi', latex: true },
      { label: 'θ', value: '\\theta', latex: true },
      { label: 'α', value: '\\alpha', latex: true },
      { label: 'β', value: '\\beta', latex: true },
      { label: '°', value: '^\\circ', latex: true },
      { label: 'log', value: '\\log(' },
      { label: 'ln', value: '\\ln(' },
      { label: 'e', value: 'e' }
    ],
    science: [
      { label: '×10ⁿ', value: '\\times 10^{}', latex: true, cursor: -1 },
      { label: 'm/s', value: '\\text{ m/s}', latex: true },
      { label: 'm/s²', value: '\\text{ m/s}^2', latex: true },
      { label: 'kg', value: '\\text{ kg}', latex: true },
      { label: 'N', value: '\\text{ N}', latex: true },
      { label: 'J', value: '\\text{ J}', latex: true },
      { label: 'W', value: '\\text{ W}', latex: true },
      { label: 'mol', value: '\\text{ mol}', latex: true },
      { label: '°C', value: '^\\circ\\text{C}', latex: true },
      { label: 'H₂O', value: 'H_2O', latex: true },
      { label: 'CO₂', value: 'CO_2', latex: true },
      { label: '→', value: '\\rightarrow', latex: true },
      { label: '⇌', value: '\\rightleftharpoons', latex: true },
      { label: 'Δ', value: '\\Delta', latex: true }
    ],
    greek: [
      { label: 'α', value: '\\alpha', latex: true, tooltip: 'alpha' },
      { label: 'β', value: '\\beta', latex: true, tooltip: 'beta' },
      { label: 'γ', value: '\\gamma', latex: true, tooltip: 'gamma' },
      { label: 'δ', value: '\\delta', latex: true, tooltip: 'delta' },
      { label: 'ε', value: '\\epsilon', latex: true, tooltip: 'epsilon' },
      { label: 'θ', value: '\\theta', latex: true, tooltip: 'theta' },
      { label: 'λ', value: '\\lambda', latex: true, tooltip: 'lambda' },
      { label: 'μ', value: '\\mu', latex: true, tooltip: 'mu' },
      { label: 'π', value: '\\pi', latex: true, tooltip: 'pi' },
      { label: 'ρ', value: '\\rho', latex: true, tooltip: 'rho' },
      { label: 'σ', value: '\\sigma', latex: true, tooltip: 'sigma' },
      { label: 'φ', value: '\\phi', latex: true, tooltip: 'phi' },
      { label: 'ω', value: '\\omega', latex: true, tooltip: 'omega' },
      { label: 'Γ', value: '\\Gamma', latex: true, tooltip: 'Gamma' },
      { label: 'Δ', value: '\\Delta', latex: true, tooltip: 'Delta' },
      { label: 'Θ', value: '\\Theta', latex: true, tooltip: 'Theta' },
      { label: 'Λ', value: '\\Lambda', latex: true, tooltip: 'Lambda' },
      { label: 'Σ', value: '\\Sigma', latex: true, tooltip: 'Sigma' },
      { label: 'Φ', value: '\\Phi', latex: true, tooltip: 'Phi' },
      { label: 'Ω', value: '\\Omega', latex: true, tooltip: 'Omega' }
    ],
    calculus: [
      { label: '∫', value: '\\int', latex: true, tooltip: 'Integral' },
      { label: '∫ₐᵇ', value: '\\int_{}^{}', latex: true, cursor: -3, tooltip: 'Definite integral' },
      { label: 'd/dx', value: '\\frac{d}{dx}', latex: true, tooltip: 'Derivative' },
      { label: '∂/∂x', value: '\\frac{\\partial}{\\partial x}', latex: true, tooltip: 'Partial derivative' },
      { label: 'lim', value: '\\lim_{x \\to }', latex: true, cursor: -1, tooltip: 'Limit' },
      { label: '∑', value: '\\sum', latex: true, tooltip: 'Summation' },
      { label: '∑ᵢ₌ₙ', value: '\\sum_{i=}^{}', latex: true, cursor: -3, tooltip: 'Summation with bounds' },
      { label: '∏', value: '\\prod', latex: true, tooltip: 'Product' },
      { label: '∞', value: '\\infty', latex: true, tooltip: 'Infinity' },
      { label: '∇', value: '\\nabla', latex: true, tooltip: 'Nabla/gradient' },
      { label: '∂', value: '\\partial', latex: true, tooltip: 'Partial' },
      { label: 'f\'', value: 'f\'', tooltip: 'Prime notation' },
      { label: 'f\'\'', value: 'f\'\'', tooltip: 'Double prime' },
      { label: '→', value: '\\to', latex: true, tooltip: 'Approaches' }
    ],
    geometry: [
      { label: '∠', value: '\\angle', latex: true, tooltip: 'Angle' },
      { label: '°', value: '^\\circ', latex: true, tooltip: 'Degree' },
      { label: '⊥', value: '\\perp', latex: true, tooltip: 'Perpendicular' },
      { label: '∥', value: '\\parallel', latex: true, tooltip: 'Parallel' },
      { label: '△', value: '\\triangle', latex: true, tooltip: 'Triangle' },
      { label: '◯', value: '\\circ', latex: true, tooltip: 'Circle' },
      { label: '≅', value: '\\cong', latex: true, tooltip: 'Congruent' },
      { label: '∼', value: '\\sim', latex: true, tooltip: 'Similar' },
      { label: '⌢', value: '\\frown', latex: true, tooltip: 'Arc' },
      { label: '∟', value: '\\sqcap', latex: true, tooltip: 'Right angle' },
      { label: '□', value: '\\square', latex: true, tooltip: 'Square' },
      { label: '⃗', value: '\\vec{}', latex: true, cursor: -1, tooltip: 'Vector' },
      { label: '|AB|', value: '|AB|', tooltip: 'Length/Distance' },
      { label: 'π', value: '\\pi', latex: true, tooltip: 'Pi' }
    ]
  };

  const handleInsertSymbol = (symbol) => {
    if (symbol.latex) {
      handleInsert(`$${symbol.value}$`, symbol.cursor);
    } else {
      handleInsert(symbol.value, symbol.cursor);
    }
  };

  const tabs = [
    { id: 'basic', label: '123', title: 'Numbers & Basic' },
    { id: 'algebra', label: 'x²', title: 'Algebra' },
    { id: 'greek', label: 'αβγ', title: 'Greek Letters' },
    { id: 'calculus', label: '∫', title: 'Calculus' },
    { id: 'geometry', label: '∠', title: 'Geometry' },
    { id: 'trig', label: 'sin', title: 'Trig & Functions' },
    { id: 'science', label: 'H₂O', title: 'Science & Units' }
  ];

  // Add recent tab if there are recent symbols
  if (recentSymbols.length > 0) {
    tabs.unshift({ id: 'recent', label: '🕐', title: 'Recently Used' });
  }

  if (compact) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Maths Symbols</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close keyboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {mathSymbols.algebra.slice(0, 12).map((symbol, index) => (
            <button
              key={index}
              onClick={() => handleInsertSymbol(symbol)}
              className="px-2 py-2 bg-gray-50 hover:bg-blue-50 rounded text-sm font-medium transition-colors"
              title={symbol.tooltip || symbol.value}
            >
              {symbol.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b">
        <h4 className="font-medium text-gray-900">Maths Keyboard</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close keyboard"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Symbol Grid */}
      <div className="p-3">
        <div className={`grid gap-1 ${activeTab === 'basic' ? 'grid-cols-6' : 'grid-cols-7'}`}>
          {(activeTab === 'recent' ? recentSymbols : mathSymbols[activeTab])?.map((symbol, index) => (
            <button
              key={index}
              onClick={() => handleInsertSymbol(symbol)}
              className="px-3 py-2 bg-gray-50 hover:bg-blue-50 rounded font-medium transition-colors text-center relative group"
              title={symbol.tooltip || symbol.value}
            >
              {symbol.label}
              {symbol.tooltip && (
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {symbol.tooltip}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600 flex justify-between items-center">
        <span><strong>Tip:</strong> Hover over symbols for descriptions. Recently used symbols appear in 🕐 tab.</span>
        {recentSymbols.length > 0 && (
          <button
            onClick={() => setRecentSymbols([])}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Recent
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentMathKeyboard;
