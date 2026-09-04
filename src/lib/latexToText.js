/**
 * LaTeX to plain text converter for feedback display
 * 
 * Strips LaTeX delimiters and converts common LaTeX commands to readable text
 * so feedback displays cleanly in UI without raw markup.
 * 
 * Defense-in-depth: companion to backend sanitization
 */

/**
 * Convert LaTeX markup to plain text for UI display
 * 
 * Handles:
 * - Delimiters: $...$, $$...$$, \(...\), \[...\]
 * - Common commands: \frac{}{}, \sqrt{}, \cdot, \times, Greek letters
 * - Superscripts and subscripts: ^{}, _{}
 * 
 * @param {string} text - String possibly containing LaTeX markup
 * @returns {string} Plain text with LaTeX converted to readable equivalents
 * 
 * @example
 * latexToText("$\\frac{1}{10}$") // "1/10"
 * latexToText("$(x-2)(x+3)$") // "(x-2)(x+3)"
 * latexToText("$$\\sqrt{x}$$") // "sqrt(x)"
 */
export const latexToText = (text) => {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  // Step 1: Normalize delimiter formats to $ and $$ for consistent processing
  // \[...\] → $$...$$ (display math)
  let result = text.replace(/\\\[([^\]]*)\\\]/g, (match, content) => `$$${content}$$`);
  // \(...\) → $...$ (inline math)
  result = result.replace(/\\\(([^)]*)\\\)/g, (match, content) => `$${content}$`);

  // Step 2: Extract and convert math regions separately
  // Split on delimiters, process math regions, rejoin
  const parts = [];
  let lastEnd = 0;

  // Find all display math ($$...$$) and inline math ($...$) regions
  const mathPattern = /(\$\$[^$]*\$\$)|(\$[^$]+?\$)/g;
  let match;

  while ((match = mathPattern.exec(result)) !== null) {
    // Add plain text before this math region
    if (match.index > lastEnd) {
      parts.push(result.substring(lastEnd, match.index));
    }

    // Convert the math region
    const mathText = match[0];
    const isDisplay = mathText.startsWith('$$');
    const inner = isDisplay ? mathText.slice(2, -2).trim() : mathText.slice(1, -1).trim();
    const converted = convertLatexCommands(inner);
    parts.push(converted);
    lastEnd = match.index + mathText.length;
  }

  // Add any remaining plain text
  if (lastEnd < result.length) {
    parts.push(result.substring(lastEnd));
  }

  result = parts.join('');

  // Step 3: Clean up any remaining LaTeX artifacts
  result = result.replace(/\$\$/g, '').replace(/\$/g, '');

  return result.trim();
};

/**
 * Convert common LaTeX commands to plain text equivalents
 * @private
 */
const convertLatexCommands = (latex) => {
  if (!latex) return '';

  let result = latex;

  // \frac{num}{denom} → num/denom
  result = result.replace(/\\frac\s*\{\s*([^}]*)\s*\}\s*\{\s*([^}]*)\s*\}/g, '$1/$2');

  // \sqrt[n]{x} → nth_root(x) or \sqrt{x} → sqrt(x)
  result = result.replace(/\\sqrt\s*\[\s*(\d+)\s*\]\s*\{\s*([^}]*)\s*\}/g, '$1st_root($2)');
  result = result.replace(/\\sqrt\s*\{\s*([^}]*)\s*\}/g, 'sqrt($1)');

  // Superscripts: ^{x} or ^x → ^x (keep visible)
  result = result.replace(/\^\s*\{\s*([^}]+)\s*\}/g, '^($1)');

  // Subscripts: _{x} or _x → _x (keep visible)
  result = result.replace(/_\s*\{\s*([^}]+)\s*\}/g, '_($1)');

  // Common symbols - map to readable equivalents
  const symbols = {
    '\\cdot': '·',
    '\\times': '×',
    '\\div': '÷',
    '\\pm': '±',
    '\\mp': '∓',
    '\\approx': '≈',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\neq': '≠',
    '\\ne': '≠',
    '\\equiv': '≡',
    '\\sim': '~',
    '\\infty': '∞',
    '\\rightarrow': '→',
    '\\leftarrow': '←',
    '\\leftrightarrow': '↔',
    '\\Rightarrow': '⇒',
    '\\Leftarrow': '⇐',
    '\\Leftrightarrow': '⇔',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\in': '∈',
    '\\notin': '∉',
    '\\subset': '⊂',
    '\\supset': '⊃',
    '\\cup': '∪',
    '\\cap': '∩',
    '\\emptyset': '∅',
    '\\ldots': '…',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\varepsilon': 'ε',
    '\\theta': 'θ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\xi': 'ξ',
    '\\pi': 'π',
    '\\rho': 'ρ',
    '\\sigma': 'σ',
    '\\tau': 'τ',
    '\\upsilon': 'υ',
    '\\phi': 'φ',
    '\\chi': 'χ',
    '\\psi': 'ψ',
    '\\omega': 'ω',
  };

  // Replace each symbol
  Object.entries(symbols).forEach(([latex, symbol]) => {
    const regex = new RegExp(latex.replace(/\\/g, '\\\\'), 'g');
    result = result.replace(regex, symbol);
  });

  // Remove any remaining LaTeX control sequences
  // E.g., \mathrm, \text, etc. — remove the command, keep the content
  result = result.replace(/\\[a-zA-Z]+\s*/g, '');

  // Clean up leftover braces
  result = result.replace(/\{\s*/g, '(').replace(/\s*\}/g, ')');

  // Normalize whitespace
  result = result.split(/\s+/).join(' ');

  return result;
};

/**
 * Sanitize feedback text for display
 * Combines LaTeX conversion with basic text cleanup
 */
export const sanitizeFeedbackText = (text) => {
  if (!text) return '';
  
  const cleaned = latexToText(text);
  
  // Basic HTML entity decode (for common entities)
  return cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

/**
 * Convert an array of feedback bullets, sanitizing each item
 */
export const sanitizeFeedbackArray = (items) => {
  if (!Array.isArray(items)) return [];
  
  return items
    .filter(Boolean)
    .map(item => sanitizeFeedbackText(String(item)));
};