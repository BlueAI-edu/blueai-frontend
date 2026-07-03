import { useState } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';
import { useAsync } from '@/hooks/use-async';
import { SUBJECT_GROUPS } from '@/pages/EnhancedAssessmentBuilderPage';

/**
 * AI question generator for the assessment builder.
 *
 * When `assessmentContext` is provided (subject, key_stage, exam_board, tier,
 * topic, subtopic, difficulty, calculator_allowed — all captured in Step 2 of
 * the builder), those facts are inherited and shown as a read-only summary
 * instead of being asked again. If the teacher set a topic in Step 2, this
 * panel is one click: review the summary → Generate.
 *
 * Without context (defensive fallback only) the full form is shown.
 */
const AIBulkGenerator = ({ onQuestionsGenerated, assessmentMode, assessmentContext = null }) => {
  // Formative assessments are 1-10 in-depth long-response questions, so the
  // generator locks the question *type* (marks are set per question); other
  // modes get the full type mix.
  const isFormative = assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE';
  const isStructured = assessmentMode === 'EXAM_STRUCTURED_GCSE_STYLE';
  const hasContext = Boolean(assessmentContext?.subject);

  const [runGenerate, generating] = useAsync();
  const [formData, setFormData] = useState({
    subject: assessmentContext?.subject || 'Mathematics',
    key_stage: assessmentContext?.key_stage || 'KS4',
    exam_board: assessmentContext?.exam_board || 'AQA',
    tier: assessmentContext?.tier || 'Higher',
    topic: assessmentContext?.topic || '',
    subtopic: assessmentContext?.subtopic || '',
    difficulty: assessmentContext?.difficulty || 'Medium',
    num_questions: isFormative ? 2 : 5,
    // Default the generated types to what the mode means: formative = long
    // responses only, structured = sub-part questions, summative = AI-decided mix.
    question_types: isFormative ? ['LONG_RESPONSE'] : isStructured ? ['STRUCTURED_WITH_PARTS'] : [],
    total_marks: 40,
    include_latex: true,
    calculator_allowed: assessmentContext?.calculator_allowed || false,
    context: 'mock exam'
  });
  // Formative UX: marks are chosen per question (the long-response 6-15 range);
  // the backend still receives a total_marks target computed from this.
  const [marksPerQuestion, setMarksPerQuestion] = useState(9);
  const [error, setError] = useState('');

  const keyStages = ['KS3', 'KS4', 'KS5'];
  const examBoards = ['AQA', 'Edexcel', 'OCR', 'WJEC', 'CIE'];
  const tiers = ['Foundation', 'Higher', 'Intermediate'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const questionTypeOptions = [
    { id: 'SHORT_ANSWER', name: 'Short Answer (1-3 marks)' },
    { id: 'MULTIPLE_CHOICE', name: 'Multiple Choice' },
    { id: 'NUMERIC', name: 'Numeric/Calculation' },
    { id: 'LONG_RESPONSE', name: 'Long Response (6+ marks)' },
    { id: 'STRUCTURED_WITH_PARTS', name: 'Structured (GCSE style)' }
  ];

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleQuestionType = (type) => {
    const types = formData.question_types.includes(type)
      ? formData.question_types.filter(t => t !== type)
      : [...formData.question_types, type];
    setFormData({ ...formData, question_types: types });
  };

  const handleGenerate = () => {
    if (!formData.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    if (isFormative && (formData.num_questions < 1 || formData.num_questions > 10)) {
      setError('Formative assessments take 1 to 10 long-response questions');
      return;
    }
    if (!isFormative && (formData.num_questions < 3 || formData.num_questions > 20)) {
      setError('Number of questions must be between 3 and 20');
      return;
    }

    setError('');
    const payload = isFormative
      ? { ...formData, total_marks: marksPerQuestion * formData.num_questions }
      : formData;
    runGenerate(
      async () => {
        const response = await axios.post(`${API}/teacher/questions/ai-generate-multi`, payload);

        if (response.data.success) {
          onQuestionsGenerated(response.data.questions);
        }
      },
      (err) => setError(getApiErrorMessage(err, 'Failed to generate questions'))
    );
  };

  return (
    <div className="space-y-5">
      {hasContext ? (
        /* Inherited assessment facts — set once in Step 2, never re-typed */
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-3">
          <span className="text-xl" aria-hidden="true">🤖</span>
          <span className="text-sm text-gray-700">Generating for</span>
          {[formData.subject, formData.key_stage, formData.exam_board, formData.tier !== 'None' ? `${formData.tier} tier` : null]
            .filter(Boolean)
            .map(fact => (
              <span key={fact} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-purple-700 shadow-sm">
                {fact}
              </span>
            ))}
          <span className="ml-auto text-xs text-gray-400">from your assessment details</span>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🤖</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI Question Generator</h3>
                <p className="text-sm text-gray-600">
                  Generate exam-quality questions. Specify your requirements and let AI create the set.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {SUBJECT_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.subjects.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Stage</label>
              <select
                value={formData.key_stage}
                onChange={(e) => handleChange('key_stage', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {keyStages.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Board</label>
              <select
                value={formData.exam_board}
                onChange={(e) => handleChange('exam_board', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {examBoards.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => handleChange('tier', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {tiers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      {/* Topic — prefilled from Step 2 when set there; editable for per-generation tweaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder="e.g., Quadratic Equations, Photosynthesis, World War II"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic (Optional)</label>
          <input
            type="text"
            value={formData.subtopic}
            onChange={(e) => handleChange('subtopic', e.target.value)}
            placeholder="e.g., Factorising, Completing the square"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
          <select
            value={formData.num_questions}
            onChange={(e) => handleChange('num_questions', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {(isFormative
              ? Array.from({ length: 10 }, (_, i) => i + 1)   // formative: 1-10
              : Array.from({ length: 18 }, (_, i) => i + 3)   // others: 3-20
            ).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {isFormative ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marks per Question</label>
            <select
              value={marksPerQuestion}
              onChange={(e) => setMarksPerQuestion(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 10 }, (_, i) => i + 6).map(n => ( // 6-15, the long-response range
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
            <select
              value={formData.total_marks}
              onChange={(e) => handleChange('total_marks', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 19 }, (_, i) => (i + 1) * 5).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Question Types */}
      {isFormative ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
          Formative assessments generate in-depth long-response questions on your topic
          ({formData.num_questions} × {marksPerQuestion} marks = {formData.num_questions * marksPerQuestion} marks total),
          each marked against a detailed mark scheme.
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Types (Select mix or leave blank for AI to decide)
          </label>
          <div className="flex flex-wrap gap-2">
            {questionTypeOptions.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleQuestionType(type.id)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                  formData.question_types.includes(type.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {formData.question_types.includes(type.id) && '✓ '}
                {type.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.include_latex}
            onChange={(e) => handleChange('include_latex', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Use LaTeX for maths</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.calculator_allowed}
            onChange={(e) => handleChange('calculator_allowed', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Calculator allowed</span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating {formData.num_questions} question{formData.num_questions !== 1 ? 's' : ''}...
          </span>
        ) : (
          `🤖 Generate ${formData.num_questions} Question${formData.num_questions !== 1 ? 's' : ''} with AI`
        )}
      </button>
    </div>
  );
};

export default AIBulkGenerator;
