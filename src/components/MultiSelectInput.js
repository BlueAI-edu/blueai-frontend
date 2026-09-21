import LaTeXRenderer from './LaTeXRenderer';
import { parseSelection, toggleOption } from '../lib/multi-select';

/**
 * MultiSelectInput — checkbox list for MULTI_SELECT ("select all that apply") questions.
 *
 * Props:
 *   options  — the question's options ([{label, text}] or plain strings)
 *   value    — the stored answer string (JSON array of ticked option texts, or '')
 *   onChange — called with the new stored answer string
 *   name     — unique name for the group (used for element ids)
 */
const MultiSelectInput = ({ options = [], value, onChange, name }) => {
  const texts = options.map((o) => (typeof o === 'string' ? o : (o.text || o.label || '')));
  const selected = new Set(parseSelection(value));

  return (
    <div className="mt-6 space-y-3" role="group" aria-label="Select all that apply">
      <p className="text-sm text-gray-600">Select all that apply.</p>
      {texts.map((text, idx) => {
        const checked = selected.has(text);
        return (
          <label
            key={idx}
            htmlFor={`${name}-${idx}`}
            className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
              checked ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              id={`${name}-${idx}`}
              type="checkbox"
              checked={checked}
              onChange={() => onChange(toggleOption(value, text, texts))}
              className="mr-3"
            />
            <LaTeXRenderer text={text} inline />
          </label>
        );
      })}
    </div>
  );
};

export default MultiSelectInput;
