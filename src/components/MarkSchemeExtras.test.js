import { formatLevel, formatMethodMark, hasMarkSchemeExtras } from './MarkSchemeExtras';

describe('MarkSchemeExtras formatting', () => {
  test('formats a level descriptor object instead of "[object Object]"', () => {
    expect(formatLevel({ level: 2, marks_range: '3-4', descriptor: 'Developed analysis' }))
      .toBe('Level 2 (3–4 marks): Developed analysis');
  });

  test('copes with missing fields and plain strings', () => {
    expect(formatLevel({ descriptor: 'No evidence' })).toBe('No evidence');
    expect(formatLevel('Level 1: basic')).toBe('Level 1: basic');
  });

  test('formats method marks', () => {
    expect(formatMethodMark({ mark_type: 'M1', description: 'correct substitution' })).toBe('M1: correct substitution');
  });

  test('detects whether there is anything to show', () => {
    expect(hasMarkSchemeExtras({ levelDescriptors: [] })).toBe(false);
    expect(hasMarkSchemeExtras({ examinerNotes: 'ignore units' })).toBe(true);
  });
});
