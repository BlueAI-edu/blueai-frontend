import React, { useState } from 'react';
import LaTeXRenderer from './LaTeXRenderer';

const FormulaSheet = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('algebra');
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedFormulas, setPinnedFormulas] = useState([]);

  const formulas = {
    algebra: [
      { name: 'Quadratic Formula', formula: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', description: 'Solves ax² + bx + c = 0' },
      { name: 'Difference of Squares', formula: 'a^2 - b^2 = (a+b)(a-b)', description: 'Factoring pattern' },
      { name: 'Perfect Square', formula: '(a \\pm b)^2 = a^2 \\pm 2ab + b^2', description: 'Expansion formula' },
      { name: 'Sum of Cubes', formula: 'a^3 + b^3 = (a+b)(a^2-ab+b^2)', description: 'Factoring cubes' },
      { name: 'Difference of Cubes', formula: 'a^3 - b^3 = (a-b)(a^2+ab+b^2)', description: 'Factoring cubes' },
      { name: 'Binomial Theorem', formula: '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k}b^k', description: 'Expansion of (a+b)ⁿ' },
    ],
    geometry: [
      { name: 'Area of Circle', formula: 'A = \\pi r^2', description: 'r = radius' },
      { name: 'Circumference', formula: 'C = 2\\pi r', description: 'Circle perimeter' },
      { name: 'Area of Triangle', formula: 'A = \\frac{1}{2}bh', description: 'b = base, h = height' },
      { name: "Pythagorean Theorem", formula: 'a^2 + b^2 = c^2', description: 'Right triangle' },
      { name: 'Area of Trapezoid', formula: 'A = \\frac{1}{2}(b_1 + b_2)h', description: 'Parallel sides b₁, b₂' },
      { name: 'Volume of Sphere', formula: 'V = \\frac{4}{3}\\pi r^3', description: 'Sphere volume' },
      { name: 'Surface Area of Sphere', formula: 'SA = 4\\pi r^2', description: 'Sphere surface' },
      { name: 'Volume of Cylinder', formula: 'V = \\pi r^2 h', description: 'Cylinder volume' },
    ],
    trigonometry: [
      { name: 'Sine Rule', formula: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}', description: 'For any triangle' },
      { name: 'Cosine Rule', formula: 'c^2 = a^2 + b^2 - 2ab\\cos C', description: 'For any triangle' },
      { name: 'Area of Triangle', formula: 'A = \\frac{1}{2}ab\\sin C', description: 'Using two sides and angle' },
      { name: 'Pythagorean Identity', formula: '\\sin^2\\theta + \\cos^2\\theta = 1', description: 'Fundamental identity' },
      { name: 'Tan Identity', formula: '\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}', description: 'Tangent definition' },
      { name: 'Double Angle (Sin)', formula: '\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta', description: 'Double angle formula' },
      { name: 'Double Angle (Cos)', formula: '\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta', description: 'Double angle formula' },
    ],
    calculus: [
      { name: 'Power Rule', formula: '\\frac{d}{dx}(x^n) = nx^{n-1}', description: 'Differentiation' },
      { name: 'Product Rule', formula: '\\frac{d}{dx}(uv) = u\\frac{dv}{dx} + v\\frac{du}{dx}', description: 'Differentiation' },
      { name: 'Quotient Rule', formula: '\\frac{d}{dx}\\left(\\frac{u}{v}\\right) = \\frac{v\\frac{du}{dx} - u\\frac{dv}{dx}}{v^2}', description: 'Differentiation' },
      { name: 'Chain Rule', formula: '\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}', description: 'Composite functions' },
      { name: 'Integration Power Rule', formula: '\\int x^n dx = \\frac{x^{n+1}}{n+1} + C', description: 'n ≠ -1' },
      { name: 'Integration by Parts', formula: '\\int u dv = uv - \\int v du', description: 'Integration technique' },
    ],
    physics: [
      { name: 'Force', formula: 'F = ma', description: 'Newton\'s 2nd Law' },
      { name: 'Kinetic Energy', formula: 'KE = \\frac{1}{2}mv^2', description: 'Energy of motion' },
      { name: 'Potential Energy', formula: 'PE = mgh', description: 'Gravitational potential' },
      { name: 'Power', formula: 'P = \\frac{W}{t} = Fv', description: 'Rate of work' },
      { name: 'Momentum', formula: 'p = mv', description: 'Linear momentum' },
      { name: "Ohm's Law", formula: 'V = IR', description: 'Voltage, current, resistance' },
      { name: 'Wave Speed', formula: 'v = f\\lambda', description: 'Frequency × wavelength' },
      { name: 'Density', formula: '\\rho = \\frac{m}{V}', description: 'Mass per unit volume' },
    ],
  };

  const categories = {
    algebra: '📐 Algebra',
    geometry: '📏 Geometry',
    trigonometry: '📊 Trigonometry',
    calculus: '∫ Calculus',
    physics: '⚡ Physics',
  };

  const togglePin = (category, index) => {
    const formulaKey = `${category}-${index}`;
    if (pinnedFormulas.includes(formulaKey)) {
      setPinnedFormulas(pinnedFormulas.filter(f => f !== formulaKey));
    } else {
      setPinnedFormulas([...pinnedFormulas, formulaKey]);
    }
  };

  const isPinned = (category, index) => {
    return pinnedFormulas.includes(`${category}-${index}`);
  };

  const filteredFormulas = searchTerm
    ? Object.entries(formulas).reduce((acc, [cat, forms]) => {
        const filtered = forms.filter(f =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[cat] = filtered;
        return acc;
      }, {})
    : { [activeCategory]: formulas[activeCategory] };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-600">
          <h2 className="text-xl font-bold text-white">📚 Formula Sheet</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search formulas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Tabs (only show if not searching) */}
        {!searchTerm && (
          <div className="flex border-b overflow-x-auto bg-gray-50">
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-3 font-medium whitespace-nowrap transition-colors ${
                  activeCategory === key
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Formulas List */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(filteredFormulas).map(([category, categoryFormulas]) => (
            <div key={category} className="mb-6">
              {searchTerm && (
                <h3 className="text-lg font-semibold mb-3 text-gray-700">{categories[category]}</h3>
              )}
              <div className="space-y-3">
                {categoryFormulas.map((formula, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isPinned(category, index) ? 'bg-yellow-50 border-yellow-300' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{formula.name}</h4>
                      <button
                        onClick={() => togglePin(category, index)}
                        className={`text-xl transition-transform hover:scale-110 ${
                          isPinned(category, index) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                        }`}
                        title={isPinned(category, index) ? 'Unpin' : 'Pin formula'}
                      >
                        📌
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded mb-2 overflow-x-auto">
                      <LaTeXRenderer latex={formula.formula} />
                    </div>
                    <p className="text-sm text-gray-600">{formula.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            💡 Tip: Pin frequently used formulas with 📌 for quick access
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormulaSheet;
