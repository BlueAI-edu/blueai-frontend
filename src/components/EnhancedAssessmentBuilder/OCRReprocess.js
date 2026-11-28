// Pure merge helpers for "Reprocess" results (no React, easy to unit test).
//
// Policy:
//  * Question-paper reprocess is ADDITIVE ONLY: it can add missing questions and
//    missing sub-parts, but never overwrites a question/part already in the review.
//  * Mark-scheme reprocess FILLS only mark schemes the teacher has not edited.

const MS_PRIORITY = ['ms_incomplete', 'not_found', 'candidate', 'matched_parent', 'matched'];
export const worstMsStatus = (states) => MS_PRIORITY.find((s) => states.includes(s)) || null;

const ROMANS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
const partKey = (label) => {
  const toks = String(label || '').toLowerCase().match(/\d+|[a-z]+/g) || [];
  let prev = '';
  return toks.map((t) => {
    let k;
    if (/^\d+$/.test(t)) k = [0, parseInt(t, 10)];
    else if (ROMANS.includes(t) && prev && !/^\d+$/.test(prev)) k = [2, ROMANS.indexOf(t)];
    else if (t.length === 1) k = [1, t.charCodeAt(0)];
    else k = [1, 1000 + [...t].reduce((a, c) => a + c.charCodeAt(0), 0)];
    prev = t;
    return k;
  });
};
export const comparePartLabels = (x, y) => {
  const a = partKey(x), b = partKey(y);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i][0] !== b[i][0]) return a[i][0] - b[i][0];
    if (a[i][1] !== b[i][1]) return a[i][1] - b[i][1];
  }
  return a.length - b.length;
};

// Remember what the extractor produced, so we can tell later whether the teacher edited it.
export const withBaseline = (q) => ({
  ...q,
  extractedMarkScheme: q.markScheme ?? '',
  parts: (q.parts || []).map((p) => ({ ...p, extractedMarkScheme: p.markScheme ?? '' })),
});

const isStructured = (q) => q.questionType === 'STRUCTURED_WITH_PARTS' && (q.parts || []).length > 0;

export const mergeReprocessedQuestions = (current, incoming) => {
  const next = current.map((q) => ({ ...q }));
  const stats = { added: 0, partsAdded: 0, upgraded: 0, unchanged: 0 };
  const touched = new Set(); // printedNumbers that changed (treated as "needs review")

  for (const raw of incoming || []) {
    const inc = withBaseline(raw);
    const pn = inc.printedNumber;
    if (pn == null) continue;
    const at = next.findIndex((q) => q.printedNumber === pn);

    if (at === -1) {
      const pos = next.findIndex((q) => (q.printedNumber ?? Infinity) > pn);
      next.splice(pos === -1 ? next.length : pos, 0, inc);
      stats.added++; touched.add(pn);
      continue;
    }
    const cur = next[at];
    if (!isStructured(cur) && isStructured(inc)) {
      // Stem was extracted earlier but its parts were lost: adopt the parts, keep the teacher's stem.
      next[at] = { ...inc, questionBody: cur.questionBody || inc.questionBody,
                   stimulusBlock: cur.stimulusBlock || inc.stimulusBlock };
      stats.upgraded++; touched.add(pn);
      continue;
    }
    if (isStructured(cur) && isStructured(inc)) {
      const have = new Set(cur.parts.map((p) => p.partLabel));
      const fresh = inc.parts.filter((p) => !have.has(p.partLabel));
      if (fresh.length) {
        const parts = [...cur.parts, ...fresh].sort((a, b) => comparePartLabels(a.partLabel, b.partLabel));
        next[at] = {
          ...cur, parts,
          maxMarks: parts.reduce((s, p) => s + (p.maxMarks || 0), 0),
          msStatus: worstMsStatus(parts.map((p) => p.msStatus)),
        };
        stats.partsAdded += fresh.length; touched.add(pn);
        continue;
      }
    }
    stats.unchanged++;
  }
  return {
    questions: next.map((q, i) => ({ ...q, questionNumber: i + 1 })),
    touched, stats,
  };
};

export const mergeMarkSchemeUpdates = (current, updates) => {
  const key = (n, p) => `${n}|${p ?? ''}`;
  const byKey = new Map((updates || []).map((u) => [key(u.printedNumber, u.partLabel), u]));
  const stats = { filled: 0, keptEdited: 0, stillMissing: 0 };

  const applyTo = (item, u, extra) => {
    if (!u) return item;
    const untouched = !(item.markScheme || '').trim() || item.markScheme === item.extractedMarkScheme;
    const out = { ...item, msStatus: u.msStatus };
    if (!untouched) { stats.keptEdited++; return out; }
    if (!(u.markScheme || '').trim() && !(u.markSchemeImages || []).length) {
      if (!(item.markScheme || '').trim()) stats.stillMissing++;
      return out; // never replace existing text with nothing
    }
    stats.filled++;
    return {
      ...out,
      markScheme: u.markScheme,
      extractedMarkScheme: u.markScheme,
      markSchemeImages: u.markSchemeImages || [],
      levelDescriptors: u.levelDescriptors || [],
      methodMarks: u.methodMarks || [],
      ...extra(u),
    };
  };

  const questions = current.map((q) => {
    if (q.printedNumber == null) return q;
    if (isStructured(q)) {
      const parts = q.parts.map((p) =>
        applyTo(p, byKey.get(key(q.printedNumber, p.partLabel)), (u) => ({ examinerNotes: u.examinerNotes })));
      return { ...q, parts, msStatus: worstMsStatus(parts.map((p) => p.msStatus)) };
    }
    return applyTo(q, byKey.get(key(q.printedNumber, null)), (u) => ({ msPageNum: u.msPageNum }));
  });
  return { questions, stats };
};