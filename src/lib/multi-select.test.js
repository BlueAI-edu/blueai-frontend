import { parseSelection, serialiseSelection, toggleOption } from './multi-select';
import { hasAnswer } from './utils';

const OPTIONS = ['Velocity', 'Speed', 'Force', 'Mass', 'Displacement'];

describe('multi-select answer helpers', () => {
  test('parseSelection reads a stored JSON array of option texts', () => {
    expect(parseSelection('["Velocity","Force"]')).toEqual(['Velocity', 'Force']);
  });

  test('parseSelection treats empty, invalid and non-array values as nothing selected', () => {
    expect(parseSelection('')).toEqual([]);
    expect(parseSelection(undefined)).toEqual([]);
    expect(parseSelection('not json')).toEqual([]);
    expect(parseSelection('{"a":1}')).toEqual([]);
  });

  test('serialiseSelection stores nothing ticked as an empty string (unanswered)', () => {
    expect(serialiseSelection([])).toBe('');
    expect(serialiseSelection(['Force'])).toBe('["Force"]');
  });

  test('toggleOption ticks and unticks, keeping the question option order', () => {
    let value = toggleOption('', 'Force', OPTIONS);
    expect(parseSelection(value)).toEqual(['Force']);
    value = toggleOption(value, 'Velocity', OPTIONS);
    expect(parseSelection(value)).toEqual(['Velocity', 'Force']); // option order, not click order
    value = toggleOption(value, 'Force', OPTIONS);
    expect(parseSelection(value)).toEqual(['Velocity']);
    expect(toggleOption(value, 'Velocity', OPTIONS)).toBe('');
  });

  test('a multi-select answer counts as answered only when something is ticked', () => {
    expect(hasAnswer('["Force"]')).toBe(true);
    expect(hasAnswer('[]')).toBe(false);
    expect(hasAnswer('')).toBe(false);
  });
});
