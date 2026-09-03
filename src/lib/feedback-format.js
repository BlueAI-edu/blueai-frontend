import { latexToText } from './latexToText';

// Feedback fields (www / next_steps / overall_feedback) may come back from the
// backend as an array of bullet points or a legacy plain string — normalise
// either into newline-separated text for editing in a textarea.
export const toDisplayText = (value) => {
  if (Array.isArray(value)) return value.join('\n');
  return value || '';
};

// Convert a textarea's newline-separated text back into an array of bullets
// for the API, matching the backend's list-based feedback schema.
export const toBulletArray = (text) =>
  (text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

// For read-only rendering: normalise to an array of bullet strings regardless
// of whether the source value is an array, a legacy string, or empty.
// Sanitizes LaTeX markup in each bullet point (defense-in-depth safety net).
export const toBulletList = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(item => latexToText(item));
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map(item => latexToText(item));
  }
  return [];
};