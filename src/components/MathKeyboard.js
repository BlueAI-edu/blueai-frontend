import React, { useState } from 'react';

const MathKeyboard = ({ onInsert, onClose }) => {
  const [activeTab, setActiveTab] = useState('basic');

  const mathSymbols = {
    basic: [
      { label: 'x²', latex: '^2' },
      { label: 'xⁿ', latex: '^{}' },
      { label: '√', latex: '\\sqrt{}' },
      { label: '∛', latex: '\\sqrt[3]{}' },
      { label: 'ⁿ√', latex: '\\sqrt[n]{}' },
      { label: '/', latex: '\\frac{}{}' },
      { label: '×', latex: '\\times' },
      { label: '÷', latex: '\\div' },
      { label: '±', latex: '\\pm' },
      { label: '∞', latex: '\\infty' },
      { label: 'π', latex: '\\pi' },
      { label: '°', latex: '^\\circ' }
    ],
    advanced: [
      { label: 'sin', latex: '\\sin(' },
      { label: 'cos', latex: '\\cos(' },
      { label: 'tan', latex: '\\tan(' },
      { label: 'log', latex: '\\log(' },
      { label: 'ln', latex: '\\ln(' },
      { label: 'e', latex: 'e' },
      { label: '∑', latex: '\\sum_{}^{}' },
      { label: '∫', latex: '\\int' },
      { label: '∂', latex: '\\partial' },
      { label: 'lim', latex: '\\lim_{x \\to }' },
      { label: 'd/dx', latex: '\\frac{d}{dx}' },
      { label: '×10ⁿ', latex: '\\times 10^{}' }
    ],
    comparison: [
      { label: '=', latex: '=' },
      { label: '≠', latex: '\\neq' },
      { label: '<', latex: '<' },
      { label: '>', latex: '>' },
      { label: '≤', latex: '\\le' },
      { label: '≥', latex: '\\ge' },
      { label: '≈', latex: '\\approx' },
      { label: '≡', latex: '\\equiv' },
      { label: '∝', latex: '\\propto' },
      { label: '→', latex: '\\rightarrow' },
      { label: '⇌', latex: '\\rightleftharpoons' },
      { label: '∴', latex: '\\therefore' }
    ],
    greek: [
      { label: 'α', latex: '\\alpha' },
      { label: 'β', latex: '\\beta' },
      { label: 'γ', latex: '\\gamma' },
      { label: 'δ', latex: '\\delta' },
      { label: 'ε', latex: '\\epsilon' },
      { label: 'θ', latex: '\\theta' },
      { label: 'λ', latex: '\\lambda' },
      { label: 'μ', latex: '\\mu' },
      { label: 'π', latex: '\\pi' },
      { label: 'σ', latex: '\\sigma' },
      { label: 'τ', latex: '\\tau' },
      { label: 'φ', latex: '\\phi' },
      { label: 'Ω', latex: '\\Omega' },
      { label: 'Δ', latex: '\\Delta' },
      { label: 'Σ', latex: '\\Sigma' },
      { label: 'Φ', latex: '\\Phi' }
    ],
    vectors: [
      { label: 'v⃗', latex: '\\vec{v}' },
      { label: '(a b)', latex: '\\begin{pmatrix} a \\\\ b \\end{pmatrix}' },
      { label: '(a b c)', latex: '\\begin{pmatrix} a \\\\ b \\\\ c \\end{pmatrix}' },
      { label: '|v|', latex: '|\\vec{v}|' },
      { label: 'i^', latex: '\\hat{i}' },
      { label: 'j^', latex: '\\hat{j}' },
      { label: 'k^', latex: '\\hat{k}' },
      { label: '⋅', latex: '\\cdot' },
      { label: '×', latex: '\\times' }
    ],
    chemistry: [
      { label: 'H₂O', latex: 'H_2O' },
      { label: 'CO₂', latex: 'CO_2' },
      { label: 'H₂SO₄', latex: 'H_2SO_4' },
      { label: 'CH₄', latex: 'CH_4' },
      { label: 'subscript', latex: '_{}' },
      { label: 'superscript', latex: '^{}' },
      { label: '⇌', latex: '\\rightleftharpoons' },
      { label: '→', latex: '\\rightarrow' },
      { label: 'Δ', latex: '\\Delta' },
      { label: '[...]', latex: '[...]' }
    ]
  };

  const handleInsert = (latex) => {
    onInsert(`$${latex}$`);
  };

  const tabs = [
    { id: 'basic', label: 'Basic' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'greek', label: 'Greek' },
    { id: 'vectors', label: 'Vectors' },
    { id: 'chemistry', label: 'Chemistry' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Math Keyboard</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-math-keyboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol Grid */}
        <div className="p-6">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {mathSymbols[activeTab].map((symbol, index) => (
              <button
                key={index}
                onClick={() => handleInsert(symbol.latex)}
                className="px-4 py-3 bg-gray-100 hover:bg-blue-100 rounded-lg text-center font-medium transition-colors"
                title={symbol.latex}
                data-testid={`math-symbol-${symbol.label}`}
              >
                {symbol.label}
              </button>
            ))}
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Tip:</span> Click any symbol to insert LaTeX code. Use $...$ for inline math or $$...$$ for display math.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathKeyboard;
