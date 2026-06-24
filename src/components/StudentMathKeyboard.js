import { useState, useRef, useEffect } from 'react';

// ─── Periodic Table Data ──────────────────────────────────────────────────────
const PERIODIC_TABLE = [
  { symbol: 'H',  name: 'Hydrogen',   num: 1,  mass: '1.008',  group: 'nonmetal'     },
  { symbol: 'He', name: 'Helium',     num: 2,  mass: '4.003',  group: 'noble'        },
  { symbol: 'Li', name: 'Lithium',    num: 3,  mass: '6.941',  group: 'alkali'       },
  { symbol: 'Be', name: 'Beryllium',  num: 4,  mass: '9.012',  group: 'alkali-earth' },
  { symbol: 'B',  name: 'Boron',      num: 5,  mass: '10.81',  group: 'metalloid'    },
  { symbol: 'C',  name: 'Carbon',     num: 6,  mass: '12.01',  group: 'nonmetal'     },
  { symbol: 'N',  name: 'Nitrogen',   num: 7,  mass: '14.01',  group: 'nonmetal'     },
  { symbol: 'O',  name: 'Oxygen',     num: 8,  mass: '16.00',  group: 'nonmetal'     },
  { symbol: 'F',  name: 'Fluorine',   num: 9,  mass: '19.00',  group: 'halogen'      },
  { symbol: 'Ne', name: 'Neon',       num: 10, mass: '20.18',  group: 'noble'        },
  { symbol: 'Na', name: 'Sodium',     num: 11, mass: '22.99',  group: 'alkali'       },
  { symbol: 'Mg', name: 'Magnesium',  num: 12, mass: '24.31',  group: 'alkali-earth' },
  { symbol: 'Al', name: 'Aluminium',  num: 13, mass: '26.98',  group: 'metal'        },
  { symbol: 'Si', name: 'Silicon',    num: 14, mass: '28.09',  group: 'metalloid'    },
  { symbol: 'P',  name: 'Phosphorus', num: 15, mass: '30.97',  group: 'nonmetal'     },
  { symbol: 'S',  name: 'Sulfur',     num: 16, mass: '32.07',  group: 'nonmetal'     },
  { symbol: 'Cl', name: 'Chlorine',   num: 17, mass: '35.45',  group: 'halogen'      },
  { symbol: 'Ar', name: 'Argon',      num: 18, mass: '39.95',  group: 'noble'        },
  { symbol: 'K',  name: 'Potassium',  num: 19, mass: '39.10',  group: 'alkali'       },
  { symbol: 'Ca', name: 'Calcium',    num: 20, mass: '40.08',  group: 'alkali-earth' },
  { symbol: 'Fe', name: 'Iron',       num: 26, mass: '55.85',  group: 'transition'   },
  { symbol: 'Cu', name: 'Copper',     num: 29, mass: '63.55',  group: 'transition'   },
  { symbol: 'Zn', name: 'Zinc',       num: 30, mass: '65.38',  group: 'transition'   },
  { symbol: 'Br', name: 'Bromine',    num: 35, mass: '79.90',  group: 'halogen'      },
  { symbol: 'Kr', name: 'Krypton',    num: 36, mass: '83.80',  group: 'noble'        },
  { symbol: 'Ag', name: 'Silver',     num: 47, mass: '107.9',  group: 'transition'   },
  { symbol: 'I',  name: 'Iodine',     num: 53, mass: '126.9',  group: 'halogen'      },
  { symbol: 'Ba', name: 'Barium',     num: 56, mass: '137.3',  group: 'alkali-earth' },
  { symbol: 'Au', name: 'Gold',       num: 79, mass: '197.0',  group: 'transition'   },
  { symbol: 'Pb', name: 'Lead',       num: 82, mass: '207.2',  group: 'metal'        },
];

const GROUP_COLORS = {
  alkali:         'bg-red-100 text-red-900 hover:bg-red-200',
  'alkali-earth': 'bg-orange-100 text-orange-900 hover:bg-orange-200',
  transition:     'bg-yellow-100 text-yellow-900 hover:bg-yellow-200',
  metal:          'bg-blue-100 text-blue-900 hover:bg-blue-200',
  metalloid:      'bg-teal-100 text-teal-900 hover:bg-teal-200',
  nonmetal:       'bg-green-100 text-green-900 hover:bg-green-200',
  halogen:        'bg-purple-100 text-purple-900 hover:bg-purple-200',
  noble:          'bg-pink-100 text-pink-900 hover:bg-pink-200',
};

// ─── All symbols use `insert` (plain Unicode text) ────────────────────────────
// `template: true` means the insert string contains a [...] placeholder so
// the student knows where to type their value.
const SYMBOLS = {
  numbers: [
    { label: '0', insert: '0' }, { label: '1', insert: '1' }, { label: '2', insert: '2' },
    { label: '3', insert: '3' }, { label: '4', insert: '4' }, { label: '5', insert: '5' },
    { label: '6', insert: '6' }, { label: '7', insert: '7' }, { label: '8', insert: '8' },
    { label: '9', insert: '9' }, { label: '.', insert: '.' }, { label: '(', insert: '(' },
    { label: ')', insert: ')' }, { label: ',', insert: ',' }, { label: 'x', insert: 'x' },
    { label: 'y', insert: 'y' }, { label: 'n', insert: 'n' }, { label: 'a', insert: 'a' },
    { label: 'b', insert: 'b' }, { label: 'c', insert: 'c' },
    { label: '+', insert: ' + ', tip: 'Plus' },
    { label: '−', insert: ' - ', tip: 'Minus' },
    { label: '×', insert: ' × ', tip: 'Multiply' },
    { label: '÷', insert: ' ÷ ', tip: 'Divide' },
  ],

  fractions: [
    { label: 'a/b',       insert: '[a]/[b]',         tip: 'Fraction — replace a and b', template: true },
    { label: 'x/2',       insert: 'x/2',             tip: 'x over 2' },
    { label: '1/x',       insert: '1/[x]',           tip: '1 over something', template: true },
    { label: 'a/b + c/d', insert: '[a]/[b] + [c]/[d]', tip: 'Sum of two fractions', template: true },
    { label: 'Mixed №',   insert: '[n] [a]/[b]',     tip: 'Mixed number e.g. 2 3/4', template: true },
    { label: '%',         insert: '%',               tip: 'Percent' },
    { label: 'per',       insert: ' per ',           tip: 'Per (rate)' },
    { label: 'a : b',     insert: '[a] : [b]',       tip: 'Ratio', template: true },
  ],

  algebra: [
    { label: 'ax²+bx+c',    insert: 'ax² + bx + c',              tip: 'Quadratic expression' },
    { label: 'x²+bx+c',     insert: 'x² + [b]x + [c]',           tip: 'Monic quadratic', template: true },
    { label: '(x+a)²',      insert: '(x + [a])²',                tip: 'Perfect square', template: true },
    { label: '(x+a)(x+b)',  insert: '(x + [a])(x + [b])',        tip: 'Factored quadratic', template: true },
    { label: 'Quad formula', insert: 'x = (-b ± √(b² - 4ac)) / (2a)', tip: 'Quadratic formula' },
    { label: 'discriminant', insert: 'b² - 4ac',                 tip: 'Discriminant' },
    { label: 'complete sq.', insert: '(x + [b/2])² - ([b/2]² - c)', tip: 'Completing the square template', template: true },
    { label: 'xⁿ',          insert: 'x^[n]',                    tip: 'Power', template: true },
    { label: '√x',          insert: '√[x]',                      tip: 'Square root', template: true },
    { label: 'ⁿ√x',         insert: '^[n]√[x]',                 tip: 'nth root', template: true },
    { label: '|x|',         insert: '|[x]|',                     tip: 'Absolute value', template: true },
    { label: 'f(x) =',      insert: 'f(x) = ',                  tip: 'Function definition' },
    { label: 'f∘g',         insert: 'f(g(x))',                   tip: 'Composite function' },
    { label: 'f⁻¹(x)',      insert: 'f⁻¹(x)',                   tip: 'Inverse function' },
    { label: 'Σ',           insert: 'Σ(i=1 to n)',              tip: 'Summation' },
    { label: 'aₙ',          insert: 'a[n]',                      tip: 'Sequence term', template: true },
    { label: 'a₁+…+aₙ',    insert: 'a₁ + a₂ + … + aₙ',        tip: 'Series' },
  ],

  functions: [
    { label: 'sin(x)',  insert: 'sin([x])',    tip: 'Sine', template: true },
    { label: 'cos(x)',  insert: 'cos([x])',    tip: 'Cosine', template: true },
    { label: 'tan(x)',  insert: 'tan([x])',    tip: 'Tangent', template: true },
    { label: 'sin⁻¹',  insert: 'sin⁻¹([x])', tip: 'Arcsin', template: true },
    { label: 'cos⁻¹',  insert: 'cos⁻¹([x])', tip: 'Arccos', template: true },
    { label: 'tan⁻¹',  insert: 'tan⁻¹([x])', tip: 'Arctan', template: true },
    { label: 'log(x)',  insert: 'log([x])',    tip: 'Log base 10', template: true },
    { label: 'logₐ(x)', insert: 'log_[a]([x])', tip: 'Log base a', template: true },
    { label: 'ln(x)',   insert: 'ln([x])',     tip: 'Natural log', template: true },
    { label: 'eˣ',     insert: 'e^[x]',       tip: 'Exponential', template: true },
    { label: 'π',      insert: 'π',           tip: 'Pi ≈ 3.14159' },
    { label: 'e',      insert: 'e',           tip: "Euler's number ≈ 2.718" },
    { label: 'd/dx',   insert: 'd/dx',        tip: 'Derivative operator' },
    { label: 'dy/dx',  insert: 'dy/dx',       tip: 'dy/dx' },
    { label: '∫',      insert: '∫[a to b] [f(x)] dx', tip: 'Definite integral', template: true },
    { label: 'lim',    insert: 'lim(x→[a]) [f(x)]',   tip: 'Limit', template: true },
  ],

  comparison: [
    { label: '=',  insert: ' = ',  tip: 'Equals' },
    { label: '≠',  insert: ' ≠ ',  tip: 'Not equal' },
    { label: '<',  insert: ' < ',  tip: 'Less than' },
    { label: '>',  insert: ' > ',  tip: 'Greater than' },
    { label: '≤',  insert: ' ≤ ',  tip: 'Less than or equal' },
    { label: '≥',  insert: ' ≥ ',  tip: 'Greater than or equal' },
    { label: '≈',  insert: ' ≈ ',  tip: 'Approximately equal' },
    { label: '≡',  insert: ' ≡ ',  tip: 'Identical to' },
    { label: '∝',  insert: ' ∝ ',  tip: 'Proportional to' },
    { label: '∴',  insert: ' ∴ ',  tip: 'Therefore' },
    { label: '∵',  insert: ' ∵ ',  tip: 'Because' },
    { label: '→',  insert: ' → ',  tip: 'Implies / gives' },
    { label: '⟺',  insert: ' ⟺ ',  tip: 'If and only if' },
    { label: '∈',  insert: ' ∈ ',  tip: 'Element of' },
    { label: '∉',  insert: ' ∉ ',  tip: 'Not element of' },
    { label: '⊂',  insert: ' ⊂ ',  tip: 'Subset of' },
    { label: '∪',  insert: ' ∪ ',  tip: 'Union' },
    { label: '∩',  insert: ' ∩ ',  tip: 'Intersection' },
    { label: '∞',  insert: '∞',    tip: 'Infinity' },
    { label: '±',  insert: ' ± ',  tip: 'Plus or minus' },
  ],

  greek: [
    { label: 'α', insert: 'α', tip: 'alpha' },
    { label: 'β', insert: 'β', tip: 'beta' },
    { label: 'γ', insert: 'γ', tip: 'gamma' },
    { label: 'Γ', insert: 'Γ', tip: 'Gamma' },
    { label: 'δ', insert: 'δ', tip: 'delta' },
    { label: 'Δ', insert: 'Δ', tip: 'Delta' },
    { label: 'ε', insert: 'ε', tip: 'epsilon' },
    { label: 'ζ', insert: 'ζ', tip: 'zeta' },
    { label: 'η', insert: 'η', tip: 'eta' },
    { label: 'θ', insert: 'θ', tip: 'theta' },
    { label: 'Θ', insert: 'Θ', tip: 'Theta' },
    { label: 'κ', insert: 'κ', tip: 'kappa' },
    { label: 'λ', insert: 'λ', tip: 'lambda' },
    { label: 'Λ', insert: 'Λ', tip: 'Lambda' },
    { label: 'μ', insert: 'μ', tip: 'mu / micro' },
    { label: 'ν', insert: 'ν', tip: 'nu' },
    { label: 'ξ', insert: 'ξ', tip: 'xi' },
    { label: 'π', insert: 'π', tip: 'pi' },
    { label: 'Π', insert: 'Π', tip: 'Pi (product)' },
    { label: 'ρ', insert: 'ρ', tip: 'rho' },
    { label: 'σ', insert: 'σ', tip: 'sigma' },
    { label: 'Σ', insert: 'Σ', tip: 'Sigma (sum)' },
    { label: 'τ', insert: 'τ', tip: 'tau' },
    { label: 'φ', insert: 'φ', tip: 'phi' },
    { label: 'Φ', insert: 'Φ', tip: 'Phi' },
    { label: 'χ', insert: 'χ', tip: 'chi' },
    { label: 'ψ', insert: 'ψ', tip: 'psi' },
    { label: 'ω', insert: 'ω', tip: 'omega' },
    { label: 'Ω', insert: 'Ω', tip: 'Omega / Ohms' },
  ],

  vectors: [
    { label: 'v⃗',      insert: 'v⃗',              tip: 'Vector v' },
    { label: 'â',       insert: 'â',              tip: 'Unit vector a' },
    { label: 'î',       insert: 'î',              tip: 'i-hat' },
    { label: 'ĵ',       insert: 'ĵ',              tip: 'j-hat' },
    { label: 'k̂',       insert: 'k̂',              tip: 'k-hat' },
    { label: '|v|',     insert: '|v⃗|',            tip: 'Magnitude of v' },
    { label: 'a·b',     insert: 'a⃗ · b⃗',          tip: 'Dot product' },
    { label: 'a×b',     insert: 'a⃗ × b⃗',          tip: 'Cross product' },
    { label: '2D col',  insert: '([x], [y])',      tip: '2D column vector', template: true },
    { label: '3D col',  insert: '([x], [y], [z])', tip: '3D column vector', template: true },
    { label: '∇',       insert: '∇',              tip: 'Del / gradient operator' },
    { label: '∂',       insert: '∂',              tip: 'Partial derivative' },
  ],

  chemistry: [
    // State symbols
    { label: '(s)',    insert: '(s)',   tip: 'Solid' },
    { label: '(l)',    insert: '(l)',   tip: 'Liquid' },
    { label: '(g)',    insert: '(g)',   tip: 'Gas' },
    { label: '(aq)',   insert: '(aq)',  tip: 'Aqueous solution' },
    // Reaction arrows
    { label: '→',     insert: ' → ',  tip: 'One-way reaction' },
    { label: '⇌',     insert: ' ⇌ ',  tip: 'Reversible reaction' },
    { label: '↑',     insert: '↑',    tip: 'Gas produced (precipitate up)' },
    { label: '↓',     insert: '↓',    tip: 'Precipitate forms' },
    // Charges
    { label: 'M²⁺',   insert: '[M]²⁺', tip: 'Cation 2+', template: true },
    { label: 'X²⁻',   insert: '[X]²⁻', tip: 'Anion 2-', template: true },
    { label: 'H⁺',    insert: 'H⁺',   tip: 'Hydrogen ion' },
    { label: 'OH⁻',   insert: 'OH⁻',  tip: 'Hydroxide ion' },
    { label: 'e⁻',    insert: 'e⁻',   tip: 'Electron' },
    // Common molecules
    { label: 'H₂O',   insert: 'H₂O',      tip: 'Water' },
    { label: 'CO₂',   insert: 'CO₂',      tip: 'Carbon dioxide' },
    { label: 'H₂SO₄', insert: 'H₂SO₄',   tip: 'Sulfuric acid' },
    { label: 'HCl',   insert: 'HCl',      tip: 'Hydrochloric acid' },
    { label: 'NaOH',  insert: 'NaOH',     tip: 'Sodium hydroxide' },
    { label: 'CH₄',   insert: 'CH₄',      tip: 'Methane' },
    { label: 'NH₃',   insert: 'NH₃',      tip: 'Ammonia' },
    // Sub/superscript helpers (Unicode)
    { label: 'Xₙ',    insert: '[X]ₙ',     tip: 'Subscript n', template: true },
    { label: 'Xⁿ',    insert: '[X]ⁿ',     tip: 'Superscript n', template: true },
    // Concentration / enthalpy
    { label: '[X]',   insert: '[[X]]',     tip: 'Concentration of X', template: true },
    { label: 'ΔH',    insert: 'ΔH',        tip: 'Enthalpy change' },
    { label: 'ΔH°',   insert: 'ΔH°',       tip: 'Standard enthalpy change' },
    { label: 'Kc',    insert: 'Kc',        tip: 'Equilibrium constant' },
    // Half-equations
    { label: 'ox. half-eq',  insert: '[species] → [products] + [n]e⁻', tip: 'Oxidation half-equation', template: true },
    { label: 'red. half-eq', insert: '[species] + [n]e⁻ → [products]', tip: 'Reduction half-equation', template: true },
  ],

  physics: [
    // SI Units
    { label: 'm/s',    insert: ' m s⁻¹',  tip: 'Metres per second' },
    { label: 'm/s²',   insert: ' m s⁻²',  tip: 'Metres per second squared' },
    { label: 'N',      insert: ' N',       tip: 'Newtons' },
    { label: 'J',      insert: ' J',       tip: 'Joules' },
    { label: 'W',      insert: ' W',       tip: 'Watts' },
    { label: 'Pa',     insert: ' Pa',      tip: 'Pascals' },
    { label: 'Ω',      insert: ' Ω',       tip: 'Ohms' },
    { label: 'μ',      insert: 'μ',        tip: 'Micro (×10⁻⁶)' },
    { label: 'kΩ',     insert: ' kΩ',      tip: 'Kilohms' },
    { label: 'eV',     insert: ' eV',      tip: 'Electron volts' },
    // SUVAT
    { label: 'v=u+at',      insert: 'v = u + at',            tip: 'SUVAT 1' },
    { label: 's=ut+½at²',   insert: 's = ut + ½at²',         tip: 'SUVAT 2' },
    { label: 'v²=u²+2as',   insert: 'v² = u² + 2as',         tip: 'SUVAT 3' },
    { label: 's=½(u+v)t',   insert: 's = ½(u + v)t',         tip: 'SUVAT 4' },
    // Mechanics & energy
    { label: 'F=ma',        insert: 'F = ma',                tip: "Newton's 2nd law" },
    { label: 'E=mc²',       insert: 'E = mc²',               tip: 'Mass-energy equivalence' },
    { label: 'KE=½mv²',     insert: 'KE = ½mv²',             tip: 'Kinetic energy' },
    { label: 'GPE=mgh',     insert: 'GPE = mgh',             tip: 'Gravitational potential energy' },
    { label: 'W=Fd',        insert: 'W = Fd',                tip: 'Work done' },
    { label: 'p=mv',        insert: 'p = mv',                tip: 'Momentum' },
    // Electricity
    { label: 'V=IR',        insert: 'V = IR',                tip: "Ohm's law" },
    { label: 'P=IV',        insert: 'P = IV',                tip: 'Electrical power' },
    { label: 'P=I²R',       insert: 'P = I²R',              tip: 'Power (current)' },
    // Angles / vectors
    { label: '°',           insert: '°',                     tip: 'Degrees' },
    { label: 'θ',           insert: 'θ',                     tip: 'Angle theta' },
    { label: 'F⃗',           insert: 'F⃗',                    tip: 'Force vector' },
    { label: 'v⃗',           insert: 'v⃗',                    tip: 'Velocity vector' },
  ],
};

const TABS = [
  { id: 'numbers',    label: '123',     icon: '🔢' },
  { id: 'fractions',  label: 'a/b',     icon: '➗' },
  { id: 'algebra',    label: 'Algebra', icon: '𝑥²' },
  { id: 'functions',  label: 'f(x)',    icon: '∫' },
  { id: 'comparison', label: '≤≥',      icon: '=' },
  { id: 'greek',      label: 'αβγ',     icon: 'α' },
  { id: 'vectors',    label: 'Vectors', icon: '→' },
  { id: 'chemistry',  label: 'Chem',    icon: '⚗' },
  { id: 'physics',    label: 'Physics', icon: '⚡' },
  { id: 'periodic',   label: 'Table',   icon: '🧪' },
];

// ─── Tip messages per tab ─────────────────────────────────────────────────────
const TAB_TIPS = {
  numbers:    'Type digits and operators directly into your answer box.',
  fractions:  'Replace [a] and [b] placeholders with your values after inserting.',
  algebra:    'Template buttons (tmpl) include [...] placeholders — replace them with your values.',
  functions:  'Replace [...] with your argument after inserting a function.',
  comparison: 'Comparison symbols are inserted with spaces on both sides.',
  greek:      'Click any Greek letter to insert it at your cursor.',
  vectors:    'Replace [...] placeholders with your components.',
  chemistry:  'Use ⇌ for reversible reactions. Replace [...] placeholders with your species.',
  physics:    'Formulae are inserted ready to edit. Units include a leading space.',
  periodic:   'Click an element to preview, then click Insert.',
};

const StudentMathKeyboard = ({ onInsert, onClose }) => {
  const [activeTab, setActiveTab] = useState('numbers');
  const [recentlyUsed, setRecentlyUsed] = useState([]);

  // Dragging
  const panelRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [pos, setPos] = useState({ x: null, y: null });

  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current.dragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({
        x: dragState.current.origX + clientX - dragState.current.startX,
        y: dragState.current.origY + clientY - dragState.current.startY,
      });
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
  }, []);

  const startDrag = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = panelRef.current.getBoundingClientRect();
    dragState.current = {
      dragging: true,
      startX: clientX, startY: clientY,
      origX: rect.left, origY: rect.top,
    };
    if (e.preventDefault) e.preventDefault();
  };

  // ── Core insert: every symbol now has `insert` (plain Unicode) ──────────────
  const handleInsert = (sym) => {
    if (!sym.insert) return; // safety guard — should never happen
    onInsert(sym.insert);
    setRecentlyUsed(prev => {
      const filtered = prev.filter(r => r.label !== sym.label);
      return [sym, ...filtered].slice(0, 8);
    });
  };

  const posStyle = pos.x !== null
    ? { position: 'fixed', left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
    : { position: 'fixed', right: 0, top: 0, bottom: 0 };

  const symbols = SYMBOLS[activeTab] || [];

  return (
    <div
      ref={panelRef}
      style={{ ...posStyle, zIndex: 44, width: 320, userSelect: 'none' }}
      className="bg-white border-l border-gray-200 shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header / drag handle */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="flex items-center justify-between px-3 py-2.5 bg-blue-700 text-white cursor-move shrink-0 select-none"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 opacity-60" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
          <span className="text-sm font-semibold tracking-wide">Maths &amp; Science Keyboard</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-blue-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div
        className="bg-gray-50 border-b border-gray-200 flex overflow-x-auto shrink-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={`flex flex-col items-center justify-center px-2.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Recently used */}
      {recentlyUsed.length > 0 && (
        <div className="px-2 py-1.5 border-b bg-amber-50 flex gap-1 flex-wrap shrink-0">
          <span className="text-xs text-amber-700 font-medium self-center mr-1">Recent:</span>
          {recentlyUsed.map((sym, i) => (
            <button
              key={i}
              onClick={() => handleInsert(sym)}
              title={sym.tip || sym.label}
              className="px-2 py-0.5 text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 rounded border border-amber-300"
            >
              {sym.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'periodic' ? (
          <PeriodicTablePanel
            onInsert={(sym) => {
              onInsert(sym.insertText);
              setRecentlyUsed(prev => {
                const filtered = prev.filter(r => r.label !== sym.label);
                return [{ label: sym.label, insert: sym.insertText, tip: sym.name }, ...filtered].slice(0, 8);
              });
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {symbols.map((sym, i) => (
                <SymbolButton key={i} sym={sym} onInsert={() => handleInsert(sym)} />
              ))}
            </div>
            <div className="mt-3 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-800">
              <strong>Tip:</strong> {TAB_TIPS[activeTab]}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Symbol Button ────────────────────────────────────────────────────────────
const SymbolButton = ({ sym, onInsert }) => (
  <button
    onClick={onInsert}
    title={sym.tip || sym.label}
    className={`
      relative px-2 py-2.5 rounded-lg text-sm font-medium text-center
      transition-all active:scale-95
      ${sym.template
        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
        : 'bg-gray-100 hover:bg-blue-100 text-gray-900 border border-gray-200'
      }
    `}
  >
    <span className="block truncate">{sym.label}</span>
    {sym.template && (
      <span className="absolute top-0.5 right-0.5 text-[8px] text-indigo-400 font-normal">tmpl</span>
    )}
  </button>
);

// ─── Periodic Table Panel ─────────────────────────────────────────────────────
const PeriodicTablePanel = ({ onInsert }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Click an element to preview, then click <strong>Insert</strong> to add it to your answer.
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-1 mb-2">
        {Object.entries(GROUP_COLORS).map(([g, cls]) => (
          <span key={g} className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>
            {g.replace('-', ' ')}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1">
        {PERIODIC_TABLE.map(el => (
          <button
            key={el.num}
            onClick={() => setSelected(el)}
            title={`${el.name} (${el.num})`}
            className={`
              flex flex-col items-center justify-center p-1 rounded border text-center transition-all active:scale-95
              ${selected?.symbol === el.symbol ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}
              ${GROUP_COLORS[el.group] || 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
            `}
          >
            <span className="text-[9px] leading-none text-gray-500">{el.num}</span>
            <span className="text-sm font-bold leading-tight">{el.symbol}</span>
            <span className="text-[8px] leading-none truncate w-full text-center">{el.mass}</span>
          </button>
        ))}
      </div>

      {/* Detail + insert buttons */}
      {selected && (
        <div className={`mt-3 p-3 rounded-lg border ${GROUP_COLORS[selected.group]} flex items-center justify-between gap-2`}>
          <div>
            <div className="font-bold text-lg">{selected.symbol}</div>
            <div className="text-xs font-medium">{selected.name}</div>
            <div className="text-xs opacity-70">№{selected.num} · {selected.mass} g/mol</div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={() => onInsert({ label: selected.symbol, insertText: selected.symbol, name: selected.name })}
              className="px-3 py-1.5 bg-blue-700 text-white text-xs rounded hover:bg-blue-800 font-medium"
            >
              Insert {selected.symbol}
            </button>
            <button
              onClick={() => onInsert({
                label: `${selected.symbol}(${selected.num})`,
                insertText: `${selected.symbol}-${selected.num}`,
                name: selected.name,
              })}
              className="px-3 py-1.5 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 font-medium"
            >
              With mass №
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2 italic">
        Showing common elements. Ask your teacher if you need one not listed.
      </p>
    </div>
  );
};

export default StudentMathKeyboard;