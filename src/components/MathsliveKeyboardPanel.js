import { useState, useRef, useEffect } from 'react';

/**
 * MathsliveKeyboardPanel
 *
 * Three-tab floating panel:
 *   1. Symbols  — clickable LaTeX symbol buttons (inserts into math-field)
 *   2. Formulae — GCSE / A-Level formula reference sheets
 *   3. Periodic Table — colour-coded element grid
 *
 * Props:
 *   shown         : bool
 *   onClose       : () => void
 *   questionType  : 'NUMERIC' | 'EXPRESSION' | 'ALGEBRA'
 *   mathfieldRef  : React ref → <math-field> DOM element
 *   mobileLayout  : bool
 */
const MathsliveKeyboardPanel = ({
  shown = false,
  onClose,
  questionType = 'ALGEBRA',
  mathfieldRef,
  mobileLayout = false,
}) => {
  const panelRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [pos, setPos] = useState({ x: null, y: null });
  const [activeTab, setActiveTab] = useState('symbols');
  const [formulaLevel, setFormulaLevel] = useState('gcse');

  // ── Drag ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current.dragging || mobileLayout) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({ x: dragState.current.origX + cx - dragState.current.startX, y: dragState.current.origY + cy - dragState.current.startY });
    };
    const onUp = () => { dragState.current.dragging = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [mobileLayout]);

  const startDrag = (e) => {
    if (mobileLayout) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = { dragging: true, startX: cx, startY: cy, origX: rect.left, origY: rect.top };
    e.preventDefault?.();
  };

  // ── Symbol insertion ─────────────────────────────────────────────────────────
  const insert = (latexCmd) => mathfieldRef?.current?.insertSymbol?.(latexCmd);

  if (!shown) return null;

  const posStyle = mobileLayout
    ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }
    : pos.x !== null
      ? { position: 'fixed', left: pos.x, top: pos.y, zIndex: 50 }
      : { position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 50 };

  const panelClass = mobileLayout ? 'w-full max-h-[70vh]' : 'w-80 h-screen';

  const TABS = [
    { id: 'symbols', label: 'Symbols' },
    { id: 'formulae', label: 'Formulae' },
    { id: 'periodic', label: 'Periodic Table' },
  ];

  return (
    <div
      ref={panelRef}
      style={posStyle}
      className={`${panelClass} bg-white border-l border-gray-200 shadow-2xl flex flex-col overflow-hidden`}
    >
      {/* ── Header ── */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className={`flex items-center justify-between px-4 py-3 bg-blue-700 text-white shrink-0 ${!mobileLayout ? 'cursor-move' : ''}`}
      >
        <div className="flex items-center gap-2">
          {!mobileLayout && (
            <svg className="w-3.5 h-3.5 opacity-60" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          )}
          <span className="text-sm font-semibold">Maths &amp; Science</span>
          <span className="text-xs px-2 py-0.5 bg-blue-600 rounded-full">
            {QUESTION_TYPE_LABELS[questionType] ?? 'Full math'}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-blue-600" aria-label="Close panel">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 shrink-0 bg-gray-50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════ SYMBOLS TAB ════ */}
        {activeTab === 'symbols' && (
          <div className="p-3 space-y-4">
            {getSymbolGroups(questionType).map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">{group.label}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {group.symbols.map(({ display, latex, title }) => (
                    <button
                      key={latex}
                      title={title}
                      onMouseDown={(e) => { e.preventDefault(); insert(latex); }}
                      className="h-10 rounded border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-sm font-mono text-gray-800 transition-colors"
                    >
                      {display}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-[10px]">Shift</kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-[10px]">Enter</kbd>
              {' — new line'}
            </div>
          </div>
        )}

        {/* ════ FORMULAE TAB ════ */}
        {activeTab === 'formulae' && (
          <div className="p-3">
            {/* Level toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4 shrink-0">
              {['gcse', 'alevel'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFormulaLevel(lvl)}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                    formulaLevel === lvl ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {lvl === 'gcse' ? 'GCSE' : 'A-Level'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {(formulaLevel === 'gcse' ? GCSE_FORMULAE : ALEVEL_FORMULAE).map(section => (
                <div key={section.topic}>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2 font-semibold">{section.topic}</p>
                  <div className="space-y-1.5">
                    {section.formulae.map((f, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded p-2">
                        <p className="text-[10px] text-gray-500 mb-0.5">{f.name}</p>
                        <p className="text-sm font-mono text-gray-800">{f.display}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ PERIODIC TABLE TAB ════ */}
        {activeTab === 'periodic' && (
          <div className="p-3">
            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
              {ELEMENT_CATEGORIES.map(cat => (
                <div key={cat.label} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-sm ${cat.bg}`} />
                  <span className="text-[9px] text-gray-500">{cat.label}</span>
                </div>
              ))}
            </div>

            {/* Flat card grid — grouped by category label */}
            {ELEMENT_CATEGORIES.map(cat => {
              const els = COMMON_ELEMENTS.filter(el => el.category === cat.key);
              if (!els.length) return null;
              return (
                <div key={cat.label} className="mb-3">
                  <p className="text-[9px] uppercase tracking-wide text-gray-400 mb-1.5">{cat.label}</p>
                  <div className="grid grid-cols-5 gap-1">
                    {els.map(el => (
                      <div
                        key={el.symbol}
                        title={`${el.name} — Z: ${el.number}, Mass: ${el.mass}`}
                        className={`rounded border border-white/60 flex flex-col items-center justify-center py-1 cursor-default ${cat.bg}`}
                      >
                        <span className="text-[8px] text-gray-600 leading-none">{el.number}</span>
                        <span className="text-[11px] font-bold text-gray-900 leading-tight">{el.symbol}</span>
                        <span className="text-[7px] text-gray-600 leading-none">{el.mass}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="text-[9px] text-gray-400 mt-1 text-center">Hover an element for full details</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS = {
  NUMERIC: 'Numbers only',
  EXPRESSION: 'Basic algebra',
  ALGEBRA: 'Full math',
};

function getSymbolGroups(questionType) {
  const basic = [
    {
      label: 'Operations',
      symbols: [
        { display: '+',  latex: '+',           title: 'Plus' },
        { display: '−',  latex: '-',           title: 'Minus' },
        { display: '×',  latex: '\\times',     title: 'Times' },
        { display: '÷',  latex: '\\div',       title: 'Divide' },
        { display: '=',  latex: '=',           title: 'Equals' },
        { display: '≠',  latex: '\\ne',        title: 'Not equal' },
        { display: '<',  latex: '<',           title: 'Less than' },
        { display: '>',  latex: '>',           title: 'Greater than' },
      ],
    },
    {
      label: 'Powers & Roots',
      symbols: [
        { display: 'x²', latex: '^2',          title: 'Square' },
        { display: 'xⁿ', latex: '^{}',         title: 'Power' },
        { display: '√',  latex: '\\sqrt{}',    title: 'Square root' },
        { display: '∛',  latex: '\\sqrt[3]{}', title: 'Cube root' },
      ],
    },
    {
      label: 'Fractions & Brackets',
      symbols: [
        { display: 'a/b', latex: '\\frac{}{}',      title: 'Fraction' },
        { display: '(',   latex: '(',                title: 'Open bracket' },
        { display: ')',   latex: ')',                title: 'Close bracket' },
        { display: '|x|', latex: '\\left|\\right|', title: 'Absolute value' },
      ],
    },
  ];

  if (questionType === 'NUMERIC') return basic.slice(0, 1);
  if (questionType === 'EXPRESSION') return basic;

  return [
    ...basic,
    {
      label: 'Greek Letters',
      symbols: [
        { display: 'π', latex: '\\pi',     title: 'Pi' },
        { display: 'θ', latex: '\\theta',  title: 'Theta' },
        { display: 'φ', latex: '\\phi',    title: 'Phi' },
        { display: 'α', latex: '\\alpha',  title: 'Alpha' },
        { display: 'β', latex: '\\beta',   title: 'Beta' },
        { display: 'λ', latex: '\\lambda', title: 'Lambda' },
        { display: 'μ', latex: '\\mu',     title: 'Mu' },
        { display: 'σ', latex: '\\sigma',  title: 'Sigma' },
      ],
    },
    {
      label: 'Functions',
      symbols: [
        { display: 'sin', latex: '\\sin(', title: 'Sine' },
        { display: 'cos', latex: '\\cos(', title: 'Cosine' },
        { display: 'tan', latex: '\\tan(', title: 'Tangent' },
        { display: 'ln',  latex: '\\ln(',  title: 'Natural log' },
        { display: 'log', latex: '\\log(', title: 'Log' },
        { display: 'eˣ',  latex: 'e^{}',   title: 'e to the power' },
        { display: '∫',   latex: '\\int',  title: 'Integral' },
        { display: 'Σ',   latex: '\\sum',  title: 'Sum' },
      ],
    },
    {
      label: 'Vectors & Geometry',
      symbols: [
        { display: 'v⃗', latex: '\\vec{}',      title: 'Vector arrow' },
        { display: '·',  latex: '\\cdot',       title: 'Dot product' },
        { display: '∠',  latex: '\\angle',      title: 'Angle' },
        { display: '°',  latex: '^{\\circ}',    title: 'Degrees' },
        { display: '∞',  latex: '\\infty',      title: 'Infinity' },
        { display: '±',  latex: '\\pm',         title: 'Plus-minus' },
        { display: '≤',  latex: '\\le',         title: 'Less or equal' },
        { display: '≥',  latex: '\\ge',         title: 'Greater or equal' },
      ],
    },
  ];
}

// ── Formula sheets ────────────────────────────────────────────────────────────

const GCSE_FORMULAE = [
  {
    topic: 'Algebra',
    formulae: [
      { name: 'Quadratic formula', display: 'x = (−b ± √(b²−4ac)) / 2a' },
      { name: 'Difference of two squares', display: 'a²−b² = (a+b)(a−b)' },
      { name: 'nth term (arithmetic)', display: 'aₙ = a + (n−1)d' },
    ],
  },
  {
    topic: 'Geometry',
    formulae: [
      { name: 'Area of circle', display: 'A = πr²' },
      { name: 'Circumference', display: 'C = 2πr' },
      { name: 'Area of trapezium', display: 'A = ½(a+b)h' },
      { name: 'Volume of prism', display: 'V = A × l' },
      { name: 'Volume of sphere', display: 'V = (4/3)πr³' },
      { name: 'Volume of cone', display: 'V = (1/3)πr²h' },
      { name: 'Pythagoras', display: 'a² + b² = c²' },
    ],
  },
  {
    topic: 'Trigonometry',
    formulae: [
      { name: 'SOH', display: 'sin θ = opp / hyp' },
      { name: 'CAH', display: 'cos θ = adj / hyp' },
      { name: 'TOA', display: 'tan θ = opp / adj' },
      { name: 'Sine rule', display: 'a/sin A = b/sin B = c/sin C' },
      { name: 'Cosine rule', display: 'a² = b²+c²−2bc cos A' },
      { name: 'Area of triangle', display: 'A = ½ab sin C' },
    ],
  },
  {
    topic: 'Statistics',
    formulae: [
      { name: 'Mean', display: 'x̄ = Σx / n' },
      { name: 'Probability', display: 'P(A) = favourable / total' },
    ],
  },
  {
    topic: 'Physics (GCSE)',
    formulae: [
      { name: 'Speed', display: 'v = d / t' },
      { name: 'Force', display: 'F = ma' },
      { name: 'Work done', display: 'W = Fd' },
      { name: 'Power', display: 'P = W / t' },
      { name: 'Kinetic energy', display: 'KE = ½mv²' },
      { name: 'GPE', display: 'GPE = mgh' },
      { name: 'Ohm\'s law', display: 'V = IR' },
      { name: 'Power (elec.)', display: 'P = IV = I²R' },
      { name: 'Wave speed', display: 'v = fλ' },
    ],
  },
];

const ALEVEL_FORMULAE = [
  {
    topic: 'Pure — Calculus',
    formulae: [
      { name: 'Product rule', display: 'd/dx(uv) = u·v\' + v·u\'' },
      { name: 'Quotient rule', display: 'd/dx(u/v) = (v·u\'−u·v\') / v²' },
      { name: 'Chain rule', display: 'dy/dx = dy/du · du/dx' },
      { name: 'Integration by parts', display: '∫u dv = uv − ∫v du' },
    ],
  },
  {
    topic: 'Pure — Series',
    formulae: [
      { name: 'Binomial expansion', display: '(1+x)ⁿ = 1+nx+n(n−1)x²/2!+…' },
      { name: 'Geometric series (sum)', display: 'S = a(1−rⁿ)/(1−r)' },
      { name: 'Sum to infinity', display: 'S∞ = a/(1−r), |r|<1' },
      { name: 'Maclaurin (eˣ)', display: 'eˣ = 1+x+x²/2!+x³/3!+…' },
    ],
  },
  {
    topic: 'Pure — Trigonometry',
    formulae: [
      { name: 'sin²θ + cos²θ', display: '= 1' },
      { name: 'tan²θ + 1', display: '= sec²θ' },
      { name: '1 + cot²θ', display: '= cosec²θ' },
      { name: 'sin(A±B)', display: 'sinA cosB ± cosA sinB' },
      { name: 'cos(A±B)', display: 'cosA cosB ∓ sinA sinB' },
      { name: 'Double angle sin', display: 'sin 2A = 2 sinA cosA' },
      { name: 'Double angle cos', display: 'cos 2A = cos²A − sin²A' },
    ],
  },
  {
    topic: 'Statistics',
    formulae: [
      { name: 'Normal standardisation', display: 'Z = (X−μ) / σ' },
      { name: 'Variance', display: 'Var(X) = E(X²) − [E(X)]²' },
      { name: 'Binomial P(X=r)', display: 'ⁿCᵣ · pʳ · (1−p)ⁿ⁻ʳ' },
    ],
  },
  {
    topic: 'Mechanics',
    formulae: [
      { name: 'SUVAT: v=u+at', display: 'v = u + at' },
      { name: 'SUVAT: s=ut+½at²', display: 's = ut + ½at²' },
      { name: 'SUVAT: v²=u²+2as', display: 'v² = u² + 2as' },
      { name: 'Momentum', display: 'p = mv' },
      { name: 'Impulse', display: 'J = Ft = Δp' },
    ],
  },
  {
    topic: 'Physics (A-Level)',
    formulae: [
      { name: 'Electric field', display: 'E = F/Q = V/d' },
      { name: 'Coulomb\'s law', display: 'F = kQ₁Q₂/r²' },
      { name: 'Gravitational field', display: 'g = GM/r²' },
      { name: 'Simple harmonic', display: 'a = −ω²x' },
      { name: 'de Broglie', display: 'λ = h/mv' },
    ],
  },
];

// ── Periodic Table ───────────────────────────────────────────────────────────

// Each category carries its key (used on elements) and Tailwind bg class
const ELEMENT_CATEGORIES = [
  { key: 'nonmetal',   label: 'Nonmetal',        bg: 'bg-blue-200' },
  { key: 'noble',      label: 'Noble gas',        bg: 'bg-purple-200' },
  { key: 'alkali',     label: 'Alkali metal',     bg: 'bg-red-200' },
  { key: 'alkaline',   label: 'Alkaline earth',   bg: 'bg-orange-200' },
  { key: 'transition', label: 'Transition metal', bg: 'bg-yellow-200' },
  { key: 'post',       label: 'Post-transition',  bg: 'bg-green-200' },
  { key: 'metalloid',  label: 'Metalloid',        bg: 'bg-teal-200' },
  { key: 'halogen',    label: 'Halogen',          bg: 'bg-indigo-200' },
  { key: 'actinide',   label: 'Actinide',         bg: 'bg-rose-200' },
];

// Curated list: first 30 elements + commonly examined heavier elements
const COMMON_ELEMENTS = [
  // ── Nonmetals ──
  { number: 1,   symbol: 'H',  name: 'Hydrogen',   mass: 1.0,   category: 'nonmetal' },
  { number: 6,   symbol: 'C',  name: 'Carbon',     mass: 12.0,  category: 'nonmetal' },
  { number: 7,   symbol: 'N',  name: 'Nitrogen',   mass: 14.0,  category: 'nonmetal' },
  { number: 8,   symbol: 'O',  name: 'Oxygen',     mass: 16.0,  category: 'nonmetal' },
  { number: 15,  symbol: 'P',  name: 'Phosphorus', mass: 31.0,  category: 'nonmetal' },
  { number: 16,  symbol: 'S',  name: 'Sulfur',     mass: 32.1,  category: 'nonmetal' },
  // ── Noble gases ──
  { number: 2,   symbol: 'He', name: 'Helium',     mass: 4.0,   category: 'noble' },
  { number: 10,  symbol: 'Ne', name: 'Neon',       mass: 20.2,  category: 'noble' },
  { number: 18,  symbol: 'Ar', name: 'Argon',      mass: 39.9,  category: 'noble' },
  // ── Alkali metals ──
  { number: 3,   symbol: 'Li', name: 'Lithium',    mass: 6.9,   category: 'alkali' },
  { number: 11,  symbol: 'Na', name: 'Sodium',     mass: 23.0,  category: 'alkali' },
  { number: 19,  symbol: 'K',  name: 'Potassium',  mass: 39.1,  category: 'alkali' },
  // ── Alkaline earth ──
  { number: 4,   symbol: 'Be', name: 'Beryllium',  mass: 9.0,   category: 'alkaline' },
  { number: 12,  symbol: 'Mg', name: 'Magnesium',  mass: 24.3,  category: 'alkaline' },
  { number: 20,  symbol: 'Ca', name: 'Calcium',    mass: 40.1,  category: 'alkaline' },
  // ── Transition metals (first row + commonly examined) ──
  { number: 22,  symbol: 'Ti', name: 'Titanium',   mass: 47.9,  category: 'transition' },
  { number: 24,  symbol: 'Cr', name: 'Chromium',   mass: 52.0,  category: 'transition' },
  { number: 25,  symbol: 'Mn', name: 'Manganese',  mass: 54.9,  category: 'transition' },
  { number: 26,  symbol: 'Fe', name: 'Iron',       mass: 55.8,  category: 'transition' },
  { number: 27,  symbol: 'Co', name: 'Cobalt',     mass: 58.9,  category: 'transition' },
  { number: 28,  symbol: 'Ni', name: 'Nickel',     mass: 58.7,  category: 'transition' },
  { number: 29,  symbol: 'Cu', name: 'Copper',     mass: 63.5,  category: 'transition' },
  { number: 30,  symbol: 'Zn', name: 'Zinc',       mass: 65.4,  category: 'transition' },
  { number: 47,  symbol: 'Ag', name: 'Silver',     mass: 107.9, category: 'transition' },
  { number: 78,  symbol: 'Pt', name: 'Platinum',   mass: 195.1, category: 'transition' },
  { number: 79,  symbol: 'Au', name: 'Gold',       mass: 197.0, category: 'transition' },
  { number: 80,  symbol: 'Hg', name: 'Mercury',    mass: 200.6, category: 'transition' },
  // ── Post-transition ──
  { number: 13,  symbol: 'Al', name: 'Aluminium',  mass: 27.0,  category: 'post' },
  { number: 50,  symbol: 'Sn', name: 'Tin',        mass: 118.7, category: 'post' },
  { number: 82,  symbol: 'Pb', name: 'Lead',       mass: 207.2, category: 'post' },
  // ── Metalloids ──
  { number: 5,   symbol: 'B',  name: 'Boron',      mass: 10.8,  category: 'metalloid' },
  { number: 14,  symbol: 'Si', name: 'Silicon',    mass: 28.1,  category: 'metalloid' },
  // ── Halogens ──
  { number: 9,   symbol: 'F',  name: 'Fluorine',   mass: 19.0,  category: 'halogen' },
  { number: 17,  symbol: 'Cl', name: 'Chlorine',   mass: 35.5,  category: 'halogen' },
  { number: 35,  symbol: 'Br', name: 'Bromine',    mass: 79.9,  category: 'halogen' },
  { number: 53,  symbol: 'I',  name: 'Iodine',     mass: 126.9, category: 'halogen' },
  // ── Actinides ──
  { number: 92,  symbol: 'U',  name: 'Uranium',    mass: 238.1, category: 'actinide' },
];

export default MathsliveKeyboardPanel;