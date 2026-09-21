/**
 * Helpers for MULTI_SELECT ("select all that apply") answers.
 *
 * A multi-select answer is stored in attempt.answers as a JSON array of the ticked
 * option texts, e.g. '["Velocity","Force"]' — the same string-valued shape every other
 * answer uses (MCQ stores the single option text). Ticking nothing stores '' so the
 * question counts as unanswered. The backend marker (`_mark_multi_select`) reads this
 * format; keep the two in step.
 */

/** Option texts ticked in a stored answer value ('' / invalid -> []). */
export function parseSelection(value) {
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && x.trim()) : [];
  } catch {
    return [];
  }
}

/** Stored answer value for a list of ticked option texts. */
export function serialiseSelection(selected) {
  return selected && selected.length ? JSON.stringify(selected) : '';
}

/** Toggle one option, keeping the ticked options in the question's own option order. */
export function toggleOption(value, optionText, allOptionTexts) {
  const current = new Set(parseSelection(value));
  if (current.has(optionText)) current.delete(optionText);
  else current.add(optionText);
  return serialiseSelection(allOptionTexts.filter((t) => current.has(t)));
}
