import { isTieredSubject } from './subject-profiles';

describe('isTieredSubject', () => {
  test('untiered GCSE subjects', () => {
    expect(isTieredSubject('History')).toBe(false);
    expect(isTieredSubject('  english   literature ')).toBe(false);
  });

  test('tiered and unknown subjects', () => {
    expect(isTieredSubject('Mathematics')).toBe(true);
    expect(isTieredSubject('Physics')).toBe(true);
    expect(isTieredSubject('Something new')).toBe(true);
  });
});
