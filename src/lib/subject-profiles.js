// Subjects that are not tiered at GCSE (#328 BLU-103). The builder used to
// default every assessment to "Higher", so History reports printed
// "Tier: Higher". Mirrors UNTIERED_SUBJECTS in
// blueai-backend/config/subject_profiles.py — keep the two in step.
const UNTIERED_SUBJECTS = new Set([
  'further mathematics', 'english language', 'english literature', 'english',
  'history', 'geography', 'religious studies', 'citizenship', 'latin',
  'computer science', 'ict', 'design and technology', 'engineering',
  'business studies', 'business', 'economics', 'accounting', 'psychology', 'sociology', 'politics',
  'art', 'art and design', 'music', 'drama', 'dance', 'media studies', 'film studies',
  'physical education', 'pe', 'food preparation and nutrition', 'classical civilisation',
]);

const normalise = (subject) => String(subject || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** False for subjects known to have no Foundation/Higher tiers; unknown subjects count as tiered. */
export const isTieredSubject = (subject) => !UNTIERED_SUBJECTS.has(normalise(subject));
