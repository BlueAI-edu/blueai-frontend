/**
 * Extracts an array from an API response regardless of whether the endpoint
 * returns the list directly or nests it under a key.
 *
 * Examples:
 *   normaliseList({ assessments: [...] }, 'assessments') → [...]
 *   normaliseList([...], 'assessments')                  → [...]
 *   normaliseList(null, 'assessments')                   → []
 */
export function normaliseList(data, key) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data[key])) return data[key];
  return [];
}

/**
 * Extracts a scalar value from an API response, with a fallback.
 *
 * Example:
 *   normaliseValue({ total: 42 }, 'total', 0) → 42
 *   normaliseValue(null, 'total', 0)           → 0
 */
export function normaliseValue(data, key, fallback = null) {
  if (!data) return fallback;
  return data[key] ?? fallback;
}
