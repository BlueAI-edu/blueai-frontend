import { useState, useCallback } from 'react';
import DiagramRenderer from '../DiagramRenderer';
import DiagramCropModal from './DiagramCropModal';
import LaTeXRenderer from '../LaTeXRenderer';

// ─── Confidence helpers ───────────────────────────────────────────────────────

const getConfidenceTier = (score) => {
  if (score === null || score === undefined) return 'unknown';
  if (score >= 0.80) return 'high';
  if (score >= 0.60) return 'medium';
  return 'low';
};

const getEffectiveTier = (question) => {
  const tier = getConfidenceTier(question.extractionConfidence);
  if (
    tier === 'high' &&
    (question.extractionFlags || []).includes('diagram_referenced_but_missing') &&
    !question.stimulusBlock
  ) {
    return 'medium';
  }
  return tier;
};

// A question needs attention when its confidence is not high, OR when its mark
// scheme is missing (extraction succeeded but no mark scheme was found for it).
const questionNeedsAttention = (q) => {
  if (getEffectiveTier(q) !== 'high') return true;
  if (q.questionType === 'STRUCTURED_WITH_PARTS') {
    return (q.parts || []).some(p => !p.markScheme?.trim());
  }
  return !q.markScheme?.trim();
};

const ConfidenceBadge = ({ question }) => {
  const tier = getEffectiveTier(question);
  const pct = question.extractionConfidence != null
    ? Math.round(question.extractionConfidence * 100) : null;

  const styles = {
    high:    'bg-green-100 text-green-800 border-green-200',
    medium:  'bg-amber-100 text-amber-800 border-amber-200',
    low:     'bg-red-100 text-red-800 border-red-200',
    unknown: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const labels = {
    high:    `High (${pct}%)`,
    medium:  `Review (${pct}%)`,
    low:     `Low (${pct}%)`,
    unknown: 'Unscored',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[tier]}`}>
      {tier === 'high'   && '✓ '}
      {tier === 'medium' && '⚠ '}
      {tier === 'low'    && '⚡ '}
      {labels[tier]}
    </span>
  );
};

const FLAG_LABELS = {
  marks_not_found:              'Marks not found — please set manually',
  question_number_unclear:      'Question number unclear',
  question_text_very_short:     'Question text is very short',
  diagram_referenced_but_missing: 'Diagram referenced but not extracted',
  scanned_page_fallback:        'Extracted via Vision (scanned page)',
};

// ─── Mark scheme image panel ──────────────────────────────────────────────────

const MarkSchemeImagePanel = ({ msPageNum, msPageThumbnails }) => {
  const [open, setOpen] = useState(false);

  if (!msPageNum || !msPageThumbnails) return null;
  const src = msPageThumbnails[String(msPageNum)];
  if (!src) return null;

  return (
    <div className="mt-2 border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-blue-800 hover:bg-blue-100 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="3 9 21 9"/><polyline points="9 21 9 9"/>
          </svg>
          View mark scheme (page {msPageNum})
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-blue-200 bg-white">
          <img
            src={src}
            alt={`Mark scheme page ${msPageNum}`}
            className="w-full block"
            style={{ height: 'auto' }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Inline edit form ─────────────────────────────────────────────────────────

const inputCls = "w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

const QuestionInlineEditor = ({ question, onChange }) => {
  const handleField = (field, value) => onChange({ ...question, [field]: value });
  const isStructured = question.questionType === 'STRUCTURED_WITH_PARTS';

  const handlePartField = (partIdx, field, value) => {
    const newParts = [...(question.parts || [])];
    newParts[partIdx] = { ...newParts[partIdx], [field]: value };
    onChange({ ...question, parts: newParts });
  };

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      {/* Root question text */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {isStructured ? 'Shared question stem' : 'Question text'}
        </label>
        <textarea
          value={question.questionBody || question.question_text || ''}
          onChange={(e) => handleField('questionBody', e.target.value)}
          rows={3}
          className={inputCls}
        />
      </div>

      {/* Non-structured: marks, type, mark scheme */}
      {!isStructured && (
        <>
          <div className="flex gap-3">
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-600 mb-1">Max marks</label>
              <input
                type="number" min="0" max="100"
                value={question.maxMarks ?? ''}
                onChange={(e) => handleField('maxMarks', parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Question type</label>
              <select
                value={question.questionType || 'SHORT_ANSWER'}
                onChange={(e) => handleField('questionType', e.target.value)}
                className={inputCls}
              >
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="NUMERIC">Numeric</option>
                <option value="LONG_RESPONSE">Long Response</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="STRUCTURED_WITH_PARTS">Structured with Parts</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mark scheme
              {question.markScheme?.trim()
                ? <span className="ml-1 text-green-600 font-normal">(pre-filled from PDF)</span>
                : <span className="ml-1 text-amber-600 font-normal">(not extracted — enter manually)</span>
              }
            </label>
            <textarea
              value={question.markScheme || ''}
              onChange={(e) => handleField('markScheme', e.target.value)}
              rows={3}
              placeholder="Enter the mark scheme here..."
              className={`${inputCls} font-mono`}
            />
          </div>
        </>
      )}

      {/* Structured: sub-parts editor */}
      {isStructured && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">
            Sub-parts ({(question.parts || []).length}) — total {question.maxMarks ?? 0} marks
          </p>
          {(question.parts || []).map((part, partIdx) => (
            <div key={partIdx} className="border border-purple-200 rounded-lg p-3 bg-purple-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-700 bg-purple-200 px-2 py-0.5 rounded">
                  Part {part.partLabel}
                </span>
                <span className="text-xs text-purple-600">{part.maxMarks ?? 0} mark{part.maxMarks !== 1 ? 's' : ''}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Part text</label>
                <textarea
                  value={part.partPrompt || ''}
                  onChange={(e) => handlePartField(partIdx, 'partPrompt', e.target.value)}
                  rows={2}
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3">
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Marks</label>
                  <input
                    type="number" min="0" max="100"
                    value={part.maxMarks ?? ''}
                    onChange={(e) => handlePartField(partIdx, 'maxMarks', parseInt(e.target.value) || 0)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Mark scheme
                  {part.markScheme?.trim()
                    ? <span className="ml-1 text-green-600 font-normal">(pre-filled)</span>
                    : <span className="ml-1 text-amber-600 font-normal">(not extracted)</span>
                  }
                </label>
                <textarea
                  value={part.markScheme || ''}
                  onChange={(e) => handlePartField(partIdx, 'markScheme', e.target.value)}
                  rows={2}
                  placeholder="Enter the mark scheme for this part..."
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Single question card ─────────────────────────────────────────────────────

const QuestionCard = ({
  question, index, total,
  onMove, onChange, onRemove,
  pageImages, msPageThumbnails,
  isReviewed, onMarkReviewed,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const tier = getEffectiveTier(question);
  const flags = question.extractionFlags || [];
  const needsAttention = questionNeedsAttention(question);

  const pageImage = pageImages && question.page_num
    ? pageImages[String(question.page_num)]
    : null;

  const handleCropConfirm = (newStimulus) => {
    onChange(index, { ...question, stimulusBlock: newStimulus });
    onMarkReviewed(index);
    setCropModalOpen(false);
  };

  const handleRemoveDiagram = () => {
    onChange(index, { ...question, stimulusBlock: null });
    onMarkReviewed(index);
    setCropModalOpen(false);
  };

  const handleSkipMissingDiagram = () => {
    onChange(index, {
      ...question,
      extractionFlags: (question.extractionFlags || []).filter(f => f !== 'diagram_referenced_but_missing'),
    });
    onMarkReviewed(index);
  };

  const handleInlineChange = (updated) => {
    onChange(index, updated);
    onMarkReviewed(index);
  };

  const handleExpand = () => {
    setExpanded(v => !v);
    // Opening the edit panel counts as starting review
    if (!expanded) onMarkReviewed(index);
  };

  const isMissingDiagram = flags.includes('diagram_referenced_but_missing') && !question.stimulusBlock;

  const hasSubParts = question.questionType === 'STRUCTURED_WITH_PARTS' && question.parts?.length > 0;
  const missingMarkScheme = hasSubParts
    ? (question.parts || []).some(p => !p.markScheme?.trim())
    : !question.markScheme?.trim();

  // Border: red when needing attention and not yet reviewed; green once reviewed; gray otherwise
  let borderLeft;
  if (needsAttention && !isReviewed) {
    borderLeft = 'border-l-red-500';
  } else if (isReviewed) {
    borderLeft = 'border-l-green-500';
  } else {
    borderLeft = 'border-l-green-400';
  }

  const bodyText = (question.questionBody || question.question_text || '').trim();
  const preview = bodyText.length > 100 ? bodyText.slice(0, 100) + '…' : bodyText;

  return (
    <>
    {cropModalOpen && pageImage && (
      <DiagramCropModal
        pageImage={pageImage}
        currentDiagram={question.stimulusBlock}
        onConfirm={handleCropConfirm}
        onRemove={question.stimulusBlock ? handleRemoveDiagram : null}
        onClose={() => setCropModalOpen(false)}
      />
    )}
    <div className={`bg-white rounded-lg border-l-4 border border-gray-200 ${borderLeft} shadow-sm`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
            <button
              onClick={() => onMove(index, index - 1)}
              disabled={index === 0}
              title="Move up"
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
            >▲</button>
            <button
              onClick={() => onMove(index, index + 1)}
              disabled={index === total - 1}
              title="Move down"
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
            >▼</button>
          </div>

          {/* Question number badge */}
          <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold mt-0.5">
            {question.questionNumber}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <ConfidenceBadge question={question} />
              <span className="text-xs text-gray-500">
                {question.maxMarks != null ? `${question.maxMarks} mark${question.maxMarks !== 1 ? 's' : ''}` : 'marks unset'}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {question.questionType || 'SHORT_ANSWER'}
              </span>
              {hasSubParts && (
                <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  {question.parts.length} sub-parts
                </span>
              )}
              {question.stimulusBlock && (
                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Has diagram
                </span>
              )}
              {missingMarkScheme && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  Mark scheme missing
                </span>
              )}
              {isReviewed && (
                <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                  ✓ Reviewed
                </span>
              )}
            </div>

            <div className="text-sm text-gray-800 leading-snug">
              {bodyText
                ? <LaTeXRenderer text={preview} />
                : <span className="italic text-gray-400">No question text extracted</span>}
            </div>

            {flags.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {flags
                  .filter(f => f !== 'diagram_referenced_but_missing')
                  .map((flag) => (
                    <li key={flag} className="text-xs text-amber-700 flex items-center gap-1">
                      <span>⚠</span> {FLAG_LABELS[flag] || flag}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleExpand}
              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50"
            >
              {expanded ? 'Collapse' : 'Edit'}
            </button>
            <button
              onClick={() => onRemove(index)}
              title="Remove question"
              className="px-2 py-1 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded hover:bg-red-50"
            >✕</button>
          </div>
        </div>

        {/* Missing diagram action banner */}
        {isMissingDiagram && (
          <div className="mt-3 ml-10 flex items-center justify-between gap-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-500 shrink-0">⚠</span>
              <span className="text-sm text-amber-800">
                This question references a diagram that wasn't automatically extracted.
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              {pageImage && (
                <button
                  onClick={() => setCropModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crop diagram
                </button>
              )}
              <button
                onClick={handleSkipMissingDiagram}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Collapsed view: diagram preview + mark scheme image */}
        {!expanded && (
          <div className="mt-2 ml-10 space-y-1">
            {question.stimulusBlock && (
              <div className="max-w-xs border border-gray-200 rounded overflow-hidden">
                <DiagramRenderer diagram={question.stimulusBlock} />
              </div>
            )}
            {pageImage && (
              <div className="flex gap-2 mt-1">
                {question.stimulusBlock ? (
                  <>
                    <button
                      onClick={() => setCropModalOpen(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50"
                    >✂ Fix crop</button>
                    <button
                      onClick={handleRemoveDiagram}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-0.5 hover:bg-red-50"
                    >Remove diagram</button>
                  </>
                ) : (
                  <button
                    onClick={() => setCropModalOpen(true)}
                    className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-50"
                  >+ Add diagram crop</button>
                )}
              </div>
            )}
            {/* Mark scheme page image — always visible so teacher can check without expanding */}
            <MarkSchemeImagePanel
              msPageNum={question.msPageNum}
              msPageThumbnails={msPageThumbnails}
            />
          </div>
        )}

        {/* Expanded inline editor */}
        {expanded && (
          <div className="ml-10">
            {question.stimulusBlock && (
              <div className="mt-2 mb-1 border border-gray-200 rounded overflow-hidden max-w-sm">
                <p className="text-xs text-gray-500 px-2 pt-1">Extracted diagram</p>
                <DiagramRenderer diagram={question.stimulusBlock} />
              </div>
            )}
            {pageImage && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setCropModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50"
                >
                  ✂ {question.stimulusBlock ? 'Fix crop' : 'Add diagram crop'}
                </button>
                {question.stimulusBlock && (
                  <button
                    onClick={handleRemoveDiagram}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-0.5 hover:bg-red-50"
                  >Remove diagram</button>
                )}
              </div>
            )}
            {/* Mark scheme page image — open by default when editing */}
            <MarkSchemeImagePanel
              msPageNum={question.msPageNum}
              msPageThumbnails={msPageThumbnails}
            />
            <QuestionInlineEditor question={question} onChange={handleInlineChange} />
          </div>
        )}
      </div>
    </div>
    </>
  );
};

// ─── Source pages panel ───────────────────────────────────────────────────────

const SourcePagesPanel = ({ thumbnails }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const entries = Object.entries(thumbnails || {}).sort(([a], [b]) => Number(a) - Number(b));

  if (!entries.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          View original pages ({entries.length} page{entries.length !== 1 ? 's' : ''})
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
            {entries.map(([pageNum, src]) => (
              <button
                key={pageNum}
                onClick={() => setSelected(selected === pageNum ? null : pageNum)}
                className={`flex-shrink-0 border-2 rounded overflow-hidden transition-colors ${
                  selected === pageNum ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'
                }`}
                title={`Page ${pageNum}`}
              >
                <img src={src} alt={`Page ${pageNum}`} className="h-24 w-auto" />
                <div className="text-center text-xs text-gray-500 py-0.5 bg-white">p.{pageNum}</div>
              </button>
            ))}
          </div>
          {selected && thumbnails[selected] && (
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Page {selected}</span>
                <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">
                  Close ✕
                </button>
              </div>
              <img
                src={thumbnails[selected]}
                alt={`Page ${selected} full view`}
                className="w-full border border-gray-200 rounded shadow-sm"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main review component ────────────────────────────────────────────────────

const OCRExtractionReview = ({
  questions: initialQuestions,
  pageThumbnails,
  pageImages,
  msPageThumbnails,
  onConfirm,
  onBack,
}) => {
  const [questions, setQuestions] = useState(() =>
    (initialQuestions || []).map((q, i) => ({ ...q, questionNumber: i + 1 }))
  );
  const [filterTier, setFilterTier] = useState('all');
  // Set of question indices the teacher has opened for editing
  const [reviewedSet, setReviewedSet] = useState(() => new Set());

  const markReviewed = useCallback((idx) => {
    setReviewedSet(prev => {
      if (prev.has(idx)) return prev;
      return new Set([...prev, idx]);
    });
  }, []);

  // Counts based on live question state
  const highCount    = questions.filter(q => getEffectiveTier(q) === 'high').length;
  const medCount     = questions.filter(q => getEffectiveTier(q) === 'medium').length;
  const lowCount     = questions.filter(q => getEffectiveTier(q) === 'low').length;
  // Include questions with missing mark scheme in the attention count, avoiding double-counting
  const attentionCount = questions.filter(questionNeedsAttention).length;
  const unreviewedCount = questions.filter((q, i) => questionNeedsAttention(q) && !reviewedSet.has(i)).length;

  const moveQuestion = useCallback((fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    setQuestions(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next.map((q, i) => ({ ...q, questionNumber: i + 1 }));
    });
  }, [questions.length]);

  const updateQuestion = useCallback((idx, updated) => {
    setQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...updated, questionNumber: idx + 1 };
      return next;
    });
  }, []);

  const removeQuestion = useCallback((idx) => {
    setQuestions(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((q, i) => ({ ...q, questionNumber: i + 1 }));
    });
    // Re-map reviewedSet indices after removal
    setReviewedSet(prev => {
      const next = new Set();
      prev.forEach(i => { if (i < idx) next.add(i); else if (i > idx) next.add(i - 1); });
      return next;
    });
  }, []);

  const filteredQuestions = filterTier === 'all'
    ? questions
    : filterTier === 'attention'
    ? questions.filter(questionNeedsAttention)
    : questions.filter(q => getEffectiveTier(q) === filterTier);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Review Extracted Questions</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Check every question before confirming. Questions highlighted in red need your attention.
            </p>
          </div>
          <button
            onClick={onBack}
            className="shrink-0 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Re-upload
          </button>
        </div>

        {/* Summary pills */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border text-sm">
            <span className="font-semibold text-gray-900">{questions.length}</span>
            <span className="text-gray-500">questions</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 text-sm">
            <span className="font-semibold text-green-800">{highCount}</span>
            <span className="text-green-700">high confidence</span>
          </div>
          {medCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 text-sm">
              <span className="font-semibold text-amber-800">{medCount}</span>
              <span className="text-amber-700">medium confidence</span>
            </div>
          )}
          {lowCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200 text-sm">
              <span className="font-semibold text-red-800">{lowCount}</span>
              <span className="text-red-700">low confidence</span>
            </div>
          )}
          {attentionCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-300 text-sm">
              <span className="font-semibold text-red-800">{attentionCount}</span>
              <span className="text-red-700">need review</span>
              {unreviewedCount < attentionCount && (
                <span className="text-green-700 ml-1">· {attentionCount - unreviewedCount} reviewed</span>
              )}
            </div>
          )}
        </div>

        {/* Attention banner — shown until all flagged questions have been reviewed */}
        {unreviewedCount > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
            <span className="text-red-500 text-lg shrink-0">⚠</span>
            <div>
              <p className="text-sm font-semibold text-red-800">
                {unreviewedCount} question{unreviewedCount !== 1 ? 's' : ''} need{unreviewedCount === 1 ? 's' : ''} your attention
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Questions with a red border have low extraction confidence or a missing mark scheme.
                Click <strong>Edit</strong> on each one to verify and correct the extracted text, then enter any missing mark scheme.
              </p>
            </div>
          </div>
        )}
        {unreviewedCount === 0 && attentionCount > 0 && (
          <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded-lg flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-green-800 font-medium">All flagged questions have been reviewed.</p>
          </div>
        )}
      </div>

      {/* Source pages panel */}
      <SourcePagesPanel thumbnails={pageThumbnails} />

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',       label: 'All',            count: questions.length },
          { key: 'attention', label: 'Needs attention', count: attentionCount },
          { key: 'high',      label: 'High confidence', count: highCount },
          { key: 'medium',    label: 'Medium',          count: medCount },
          { key: 'low',       label: 'Low',             count: lowCount },
        ].filter(f => f.key === 'all' || f.key === 'attention' || f.count > 0).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterTier(key)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filterTier === key
                ? key === 'attention' || key === 'low'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
            {key !== 'all' && <span className="ml-1 opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      {/* Question list */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500 text-sm">
          No questions in this category.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => {
            const realIdx = questions.indexOf(q);
            return (
              <QuestionCard
                key={q.id || q.questionNumber}
                question={q}
                index={realIdx}
                total={questions.length}
                onMove={moveQuestion}
                onChange={updateQuestion}
                onRemove={removeQuestion}
                pageImages={pageImages}
                msPageThumbnails={msPageThumbnails}
                isReviewed={reviewedSet.has(realIdx)}
                onMarkReviewed={markReviewed}
              />
            );
          })}
        </div>
      )}

      {/* Sticky confirm bar */}
      <div className="sticky bottom-0 bg-white border-t shadow-lg rounded-b-lg px-5 py-4 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          {unreviewedCount > 0 ? (
            <span className="text-red-600 font-medium">
              Review {unreviewedCount} remaining question{unreviewedCount !== 1 ? 's' : ''} before continuing
            </span>
          ) : (
            <span className="text-green-700 font-medium">
              {questions.length} question{questions.length !== 1 ? 's' : ''} ready — all reviewed
            </span>
          )}
        </div>
        <button
          onClick={() => onConfirm(questions)}
          disabled={questions.length === 0 || unreviewedCount > 0}
          title={unreviewedCount > 0 ? `${unreviewedCount} question${unreviewedCount !== 1 ? 's' : ''} still need review` : undefined}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Confirm &amp; Edit Questions →
        </button>
      </div>
    </div>
  );
};

export default OCRExtractionReview;
