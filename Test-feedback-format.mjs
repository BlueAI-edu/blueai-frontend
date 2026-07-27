/**
 * Plain Node test script for src/lib/feedback-format.js
 *
 * No test framework required — run directly with:
 *   node test_feedback_format.js
 *
 * If your project uses ES modules (package.json has "type": "module"),
 * this file will work as-is with the import below. If your project uses
 * CommonJS, change the import line to:
 *   const { toDisplayText, toBulletArray, toBulletList } = require('./src/lib/feedback-format');
 * and rename this file to test_feedback_format.cjs (or adjust accordingly).
 */

import { toDisplayText, toBulletArray, toBulletList } from './src/lib/feedback-format.js';

let passed = 0;
let failed = 0;
const failures = [];

function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    failures.push({ label, expected: e, actual: a });
  }
}

console.log('Running feedback-format tests...\n');

// ---------------------------------------------------------------------
// toDisplayText — normalises value into a single newline-joined string
// (used to populate editable textareas)
// ---------------------------------------------------------------------

assertEqual(
  toDisplayText(['Good use of formula', 'Check your units', 'Show working']),
  'Good use of formula\nCheck your units\nShow working',
  'toDisplayText: array of bullets -> newline-joined string'
);

assertEqual(
  toDisplayText('Legacy plain string feedback'),
  'Legacy plain string feedback',
  'toDisplayText: legacy string passes through unchanged'
);

assertEqual(
  toDisplayText([]),
  '',
  'toDisplayText: empty array -> empty string'
);

assertEqual(
  toDisplayText(''),
  '',
  'toDisplayText: empty string -> empty string'
);

assertEqual(
  toDisplayText(null),
  '',
  'toDisplayText: null -> empty string'
);

assertEqual(
  toDisplayText(undefined),
  '',
  'toDisplayText: undefined -> empty string'
);

assertEqual(
  toDisplayText(['Only one bullet']),
  'Only one bullet',
  'toDisplayText: single-item array -> no trailing newline'
);

// ---------------------------------------------------------------------
// toBulletArray — normalises textarea text back into an array for the API
// ---------------------------------------------------------------------

assertEqual(
  toBulletArray('Good use of formula\nCheck your units\nShow working'),
  ['Good use of formula', 'Check your units', 'Show working'],
  'toBulletArray: newline-separated text -> array'
);

assertEqual(
  toBulletArray('Single line, no newlines'),
  ['Single line, no newlines'],
  'toBulletArray: single line -> single-item array'
);

assertEqual(
  toBulletArray(''),
  [],
  'toBulletArray: empty string -> empty array'
);

assertEqual(
  toBulletArray(null),
  [],
  'toBulletArray: null -> empty array'
);

assertEqual(
  toBulletArray(undefined),
  [],
  'toBulletArray: undefined -> empty array'
);

assertEqual(
  toBulletArray('  Line with padding  \n\n  Another line  '),
  ['Line with padding', 'Another line'],
  'toBulletArray: trims whitespace and drops blank lines'
);

assertEqual(
  toBulletArray('Line one\n\n\nLine two'),
  ['Line one', 'Line two'],
  'toBulletArray: collapses multiple consecutive blank lines'
);

// ---------------------------------------------------------------------
// toDisplayText + toBulletArray round-trip
// (edit -> save -> reload should not lose or corrupt data)
// ---------------------------------------------------------------------

const original = ['Point one', 'Point two', 'Point three'];
assertEqual(
  toBulletArray(toDisplayText(original)),
  original,
  'round-trip: array -> display text -> array returns original'
);

// ---------------------------------------------------------------------
// toBulletList — normalises value into an array of bullets for read-only
// rendering (used directly in JSX, must never throw or render objects)
// ---------------------------------------------------------------------

assertEqual(
  toBulletList(['Bullet A', 'Bullet B']),
  ['Bullet A', 'Bullet B'],
  'toBulletList: array input passes through'
);

assertEqual(
  toBulletList('Legacy single-line string'),
  ['Legacy single-line string'],
  'toBulletList: legacy single-line string -> single-item array'
);

assertEqual(
  toBulletList('Legacy line one\nLegacy line two'),
  ['Legacy line one', 'Legacy line two'],
  'toBulletList: legacy multi-line string -> split into bullets'
);

assertEqual(
  toBulletList(''),
  [],
  'toBulletList: empty string -> empty array'
);

assertEqual(
  toBulletList(null),
  [],
  'toBulletList: null -> empty array'
);

assertEqual(
  toBulletList(undefined),
  [],
  'toBulletList: undefined -> empty array'
);

assertEqual(
  toBulletList([]),
  [],
  'toBulletList: empty array -> empty array'
);

assertEqual(
  toBulletList(['Kept', '', null, undefined, 'Also kept']),
  ['Kept', 'Also kept'],
  'toBulletList: filters out falsy items from array input'
);

assertEqual(
  toBulletList('   '),
  [],
  'toBulletList: whitespace-only string -> empty array'
);

// ---------------------------------------------------------------------
// Regression guard: the copy-paste bug caught earlier in
// SubmissionDetailPage.js (all three fields reading from `.www`)
// This isn't a util bug, but documents the exact failure this system
// is meant to catch — three different inputs must not silently produce
// the same output when routed through the same field-specific call.
// ---------------------------------------------------------------------

const wwwField = ['WWW point'];
const nextStepsField = ['Next steps point'];
const overallField = ['Overall point'];

const wwwResult = toBulletList(wwwField);
const nextStepsResult = toBulletList(nextStepsField);
const overallResult = toBulletList(overallField);

if (
  JSON.stringify(wwwResult) === JSON.stringify(nextStepsResult) ||
  JSON.stringify(nextStepsResult) === JSON.stringify(overallResult)
) {
  failed++;
  failures.push({
    label: 'regression: distinct fields must not collapse to the same output',
    expected: 'three distinct arrays',
    actual: 'two or more fields produced identical output — check call sites, not the util',
  });
} else {
  passed++;
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.label}`);
    console.log(`      expected: ${f.expected}`);
    console.log(`      actual:   ${f.actual}`);
  }
  process.exitCode = 1;
} else {
  console.log('\nAll tests passed.');
}