import React from 'react';
import DiagramLabelInput from '../DiagramLabelInput';
import QuestionTypeSelector from './QuestionTypeSelector';
import MCQEditor from './MCQEditor';
import StructuredQuestionBuilder from './StructuredQuestionBuilder';
import StimulusUploader from './StimulusUploader';
import MixedMathEditor from '../MixedMathEditor';
import DiagramRenderer from '../DiagramRenderer';

const LONG_RESPONSE_MIN_MARKS = 1;
const LONG_RESPONSE_MAX_MARKS = 15;

/**
 * Auto-marked graph answer configuration (diagram pipeline D4).
 *
 * Writes two fields onto the question:
 *   graphSpec     — { axes } only; safe to send to students (drives the
 *                   GraphPlotInput widget on the attempt page)
 *   expectedGraph — { rules } the deterministic grader marks against
 *                   (services/graph_answer_grader.py)
 */
const GraphAnswerEditor = ({ question, updateQuestion }) => {
  const enabled = Boolean(question.graphSpec);
  const spec = question.graphSpec || { axes: { x: [-10, 10, 1], y: [-10, 10, 1] } };
  const rules = question.expectedGraph?.rules || [];
  const pointsRule = rules.find((r) => r.kind === 'points');
  const lineRule = rules.find((r) => r.kind === 'line');

  const setAxis = (axis, idx, value) => {
    const axes = { ...spec.axes, [axis]: [...spec.axes[axis]] };
    axes[axis][idx] = value === '' ? 0 : parseFloat(value);
    updateQuestion('graphSpec', { ...spec, axes });
  };

  const setRules = (nextPointsRule, nextLineRule) => {
    const nextRules = [nextPointsRule, nextLineRule].filter(Boolean);
    updateQuestion('expectedGraph', nextRules.length ? { rules: nextRules } : null);
  };

  const parsePointsText = (text) =>
    text
      .split(/\n|;/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(',').map((v) => parseFloat(v.trim())))
      .filter((pair) => pair.length === 2 && pair.every((v) => !Number.isNaN(v)));

  if (!enabled) {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={false}
          onChange={() => {
            updateQuestion('graphSpec', { axes: { x: [-10, 10, 1], y: [-10, 10, 1] } });
          }}
          className="rounded"
        />
        Auto-marked graph answer (student plots points/a line; marked without AI)
      </label>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-900">Auto-marked graph answer</span>
        <button
          type="button"
          onClick={() => { updateQuestion('graphSpec', null); updateQuestion('expectedGraph', null); }}
          className="text-xs text-red-600 hover:underline"
        >
          Disable
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[['x', 0, 'X min'], ['x', 1, 'X max'], ['y', 0, 'Y min'], ['y', 1, 'Y max']].map(([axis, idx, label]) => (
          <div key={label}>
            <label className="block text-xs text-gray-600 mb-0.5">{label}</label>
            <input
              type="number"
              value={spec.axes[axis][idx]}
              onChange={(e) => setAxis(axis, idx, e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-0.5">
          Expected points — one per line as <code>x, y</code> (leave empty if only a line is marked)
        </label>
        <textarea
          rows={2}
          defaultValue={(pointsRule?.points || []).map((p) => p.join(', ')).join('\n')}
          onBlur={(e) => {
            const pts = parsePointsText(e.target.value);
            setRules(
              pts.length ? { kind: 'points', points: pts, marks: pointsRule?.marks || pts.length, tolerance: 0.5 } : null,
              lineRule || null
            );
          }}
          placeholder={'1, 3\n2, 5'}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-mono"
        />
        {pointsRule && (
          <div className="flex items-center gap-2 mt-1">
            <label className="text-xs text-gray-600">Marks for points:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={pointsRule.marks}
              onChange={(e) => setRules({ ...pointsRule, marks: parseInt(e.target.value) || 1 }, lineRule || null)}
              className="w-16 px-2 py-0.5 text-sm border border-gray-300 rounded"
            />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(lineRule)}
            onChange={(e) =>
              setRules(pointsRule || null, e.target.checked ? { kind: 'line', slope: 1, intercept: 0, marks: 2 } : null)
            }
            className="rounded"
          />
          Expect a straight line <code>y = mx + c</code>
        </label>
        {lineRule && (
          <div className="flex flex-wrap items-center gap-3 pl-5">
            {[['slope', 'm (slope)'], ['intercept', 'c (intercept)'], ['marks', 'Marks']].map(([field, label]) => (
              <div key={field} className="flex items-center gap-1">
                <label className="text-xs text-gray-600">{label}:</label>
                <input
                  type="number"
                  step={field === 'marks' ? 1 : 0.1}
                  value={lineRule[field]}
                  onChange={(e) =>
                    setRules(pointsRule || null, {
                      ...lineRule,
                      [field]: field === 'marks' ? (parseInt(e.target.value) || 1) : (parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-20 px-2 py-0.5 text-sm border border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-emerald-800">
        Students see a click-to-plot grid instead of a drawing canvas; their answer is marked
        deterministically against these values — no AI call, exact and instant.
      </p>
    </div>
  );
};

/**
 * Complete-the-diagram marking zones (pipeline D5). Only offered when the
 * question has an image stimulus. The teacher clicks where each label belongs
 * and types the accepted answer(s), comma-separated; each pin becomes a
 * marking zone worth 1 mark. Writes `diagramLabels: true` (student-safe flag)
 * and `expectedDiagram {zones}` (the grading spec — never shown to students).
 */
const DiagramZoneEditor = ({ question, updateQuestion }) => {
  if (question.stimulusBlock?.type !== 'image') return null;

  const enabled = question.diagramLabels === true;
  const zones = question.expectedDiagram?.zones || [];

  const setFromLabels = (answer) => {
    const nextZones = (answer.labels || []).map((l) => ({
      x: l.x,
      y: l.y,
      r: 0.08,
      marks: 1,
      accept: l.text.split(',').map((s) => s.trim()).filter(Boolean),
    }));
    updateQuestion('expectedDiagram', nextZones.length ? { zones: nextZones } : null);
  };

  if (!enabled) {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={false}
          onChange={() => updateQuestion('diagramLabels', true)}
          className="rounded"
        />
        Auto-marked labelling (student labels this question's diagram; marked without AI)
      </label>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-900">
          Complete-the-diagram labelling ({zones.length} zone{zones.length !== 1 ? 's' : ''} · {zones.length} mark{zones.length !== 1 ? 's' : ''})
        </span>
        <button
          type="button"
          onClick={() => { updateQuestion('diagramLabels', null); updateQuestion('expectedDiagram', null); }}
          className="text-xs text-red-600 hover:underline"
        >
          Disable
        </button>
      </div>
      <DiagramLabelInput
        image={question.stimulusBlock.content}
        editMode
        value={{ labels: zones.map((z) => ({ x: z.x, y: z.y, text: (z.accept || []).join(', ') })) }}
        onChange={setFromLabels}
      />
      <p className="text-xs text-emerald-800">
        Students see the diagram and place typed labels; each zone scores 1 mark when a matching
        label (any accepted spelling, case-insensitive) lands within it — no AI call.
      </p>
    </div>
  );
};

const QuestionEditor = ({
  question,
  questionIndex,
  onQuestionChange,
  onRemove,
  assessmentMode,
  assessmentId
}) => {
  const updateQuestion = (field, value) => {
    onQuestionChange(questionIndex, { ...question, [field]: value });
  };

  const initializeMCQOptions = () => {
    if (!question.options || question.options.length === 0) {
      updateQuestion('options', [
        { label: 'A', text: '', isCorrect: false },
        { label: 'B', text: '', isCorrect: false },
        { label: 'C', text: '', isCorrect: false },
        { label: 'D', text: '', isCorrect: false }
      ]);
    }
  };

  const getMarksConfig = () => {
    if (question.questionType === 'LONG_RESPONSE') {
      return { min: LONG_RESPONSE_MIN_MARKS, max: LONG_RESPONSE_MAX_MARKS };
    }
    return { min: 1, max: 20 };
  };

  const handleMarksChange = (val) => {
    updateQuestion('maxMarks', parseInt(val) || 1);
  };

  const marksOutOfRange =
    question.questionType === 'LONG_RESPONSE' &&
    (question.maxMarks < LONG_RESPONSE_MIN_MARKS || question.maxMarks > LONG_RESPONSE_MAX_MARKS);

  const initializeStructuredParts = () => {
    if (!question.parts || question.parts.length === 0) {
      updateQuestion('parts', [
        { partLabel: 'a', partPrompt: '', maxMarks: 1, answerType: 'TEXT', markScheme: '' }
      ]);
    }
  };

  React.useEffect(() => {
    if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'MULTI_SELECT') {
      initializeMCQOptions();
    }
    if (question.questionType === 'STRUCTURED_WITH_PARTS') {
      initializeStructuredParts();
    }
  }, [question.questionType]);

  return (
    <div className="border-2 border-gray-200 rounded-lg bg-white">
      {/* Question Header */}
      <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
            {question.questionNumber}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Question {question.questionNumber}</h3>
            <p className="text-sm text-gray-600">
              {question.questionType?.replace(/_/g, ' ') || 'Select type'} • {question.maxMarks || 0} marks
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemove(questionIndex)}
          className="text-red-600 hover:text-red-700 font-medium text-sm"
        >
          Remove
        </button>
      </div>

      <div className="p-4 space-y-4">
        <>
            {/* Question Type Selector */}
            {!question.questionType && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Select Question Type</h4>
                <QuestionTypeSelector
                  selectedType={question.questionType}
                  onTypeChange={(type) => {
                    onQuestionChange(questionIndex, {
                      ...question,
                      questionType: type,
                      maxMarks: type === 'LONG_RESPONSE' ? LONG_RESPONSE_MIN_MARKS : question.maxMarks
                    });
                  }}
                  mode={assessmentMode}
                />
              </div>
            )}

            {question.questionType && (
              <>
                {/* Stimulus Uploader (for GCSE Structured — manual upload) */}
                {question.questionType === 'STRUCTURED_WITH_PARTS' && assessmentId && !question.stimulusBlock && (
                  <StimulusUploader
                    assessmentId={assessmentId}
                    questionNumber={question.questionNumber}
                    currentStimulus={question.stimulusBlock}
                    onStimulusUploaded={(stimulus) => updateQuestion('stimulusBlock', stimulus)}
                  />
                )}

                {/* OCR-extracted diagram preview (shown for all question types when present) */}
                {question.stimulusBlock && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Extracted Diagram</span>
                      <button
                        onClick={() => updateQuestion('stimulusBlock', null)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <DiagramRenderer diagram={question.stimulusBlock} />
                  </div>
                )}

                {/* Question Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                  <MixedMathEditor
                    value={question.questionBody || ''}
                    onChange={(v) => updateQuestion('questionBody', v)}
                    placeholder="Enter your question here..."
                    rows={3}
                  />
                </div>

                {/* MCQ Options */}
                {(question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'MULTI_SELECT') && (
                  <MCQEditor
                    options={question.options || []}
                    onOptionsChange={(opts) => updateQuestion('options', opts)}
                    allowMultiSelect={question.questionType === 'MULTI_SELECT'}
                    onMultiSelectChange={(val) => updateQuestion('allowMultiSelect', val)}
                  />
                )}

                {/* Structured Parts */}
                {question.questionType === 'STRUCTURED_WITH_PARTS' && (
                  <StructuredQuestionBuilder
                    parts={question.parts || []}
                    onPartsChange={(parts) => {
                      const totalMarks = parts.reduce((sum, p) => sum + (p.maxMarks || 0), 0);
                      onQuestionChange(questionIndex, { ...question, parts, maxMarks: totalMarks });
                    }}
                    questionNumber={question.questionNumber}
                  />
                )}

                {/* Marks and Mark Scheme (for non-structured) */}
                {question.questionType !== 'STRUCTURED_WITH_PARTS' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marks
                          {question.questionType === 'LONG_RESPONSE' && (
                            <span className="ml-1 text-xs text-blue-600 font-normal">(1–15)</span>
                          )}
                        </label>
                        <select
                          value={question.maxMarks || 1}
                          onChange={(e) => handleMarksChange(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from(
                            { length: getMarksConfig().max - getMarksConfig().min + 1 },
                            (_, i) => i + getMarksConfig().min
                          ).map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Answer Type</label>
                        <select
                          value={question.answerType || 'TEXT'}
                          onChange={(e) => updateQuestion('answerType', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="TEXT">Text</option>
                          <option value="NUMERIC">Numeric</option>
                          <option value="MATHS">Maths (LaTeX)</option>
                          <option value="MIXED">Mixed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mark Scheme</label>
                      <MixedMathEditor
                        value={question.markScheme || ''}
                        onChange={(v) => updateQuestion('markScheme', v)}
                        placeholder="Enter marking criteria..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model Answer (Optional)</label>
                      <MixedMathEditor
                        value={question.modelAnswer || ''}
                        onChange={(v) => updateQuestion('modelAnswer', v)}
                        placeholder="Enter model answer for reference..."
                        rows={2}
                      />
                    </div>
                  </>
                )}

                {/* Additional Options */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Drawing canvas:</span>
                    <select
                      value={question.drawingEnabled === true ? 'on' : question.drawingEnabled === false ? 'off' : 'auto'}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateQuestion('drawingEnabled', v === 'auto' ? null : v === 'on');
                      }}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="auto">Auto-detect</option>
                      <option value="on">Always show</option>
                      <option value="off">Disabled</option>
                    </select>
                  </div>
                </div>

                <GraphAnswerEditor question={question} updateQuestion={updateQuestion} />
                <DiagramZoneEditor question={question} updateQuestion={updateQuestion} />
              </>
            )}
          </>
      </div>

    </div>
  );
};

export default React.memo(QuestionEditor);
