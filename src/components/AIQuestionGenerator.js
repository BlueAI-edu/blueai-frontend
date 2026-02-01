import React, { useState } from 'react';
import axios from 'axios';
import MathKeyboard from './MathKeyboard';
import LaTeXRenderer from './LaTeXRenderer';

const API = `${window.location.origin}/api`;

const AIQuestionGenerator = ({ user, onQuestionsGenerated }) => {
  const [formData, setFormData] = useState({
    subject: 'Maths',
    key_stage: 'KS4',
    exam_board: 'AQA',
    tier: 'Higher',
    topic: '',
    subtopic: '',
    difficulty: 'Medium',
    question_type: 'Short answer',
    marks: 4,
    num_questions: 1,
    include_latex: true,
    include_diagrams: 'none',
    calculator_allowed: false,
    strictness: 'strict',
    command_words: '',
    question_context: 'mock exam'
  });

  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [error, setError] = useState('');
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const subjects = ['Maths', 'Physics', 'Chemistry', 'Biology', 'Combined Science', 'English Lang', 'English Lit', 'Geography', 'History'];
  const keyStages = ['KS3', 'KS4', 'KS5'];
  const examBoards = ['AQA', 'Edexcel', 'OCR', 'WJEC'];
  const tiers = ['Foundation', 'Higher', 'N/A'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const questionTypes = [
    'Short answer',
    'Structured calculation',
    'Derivation',
    'Graph/Diagram-based',
    'Explain/describe',
    'Extended response',
    'Data interpretation'
  ];
  const diagramOptions = [
    { value: 'none', label: 'None' },
    { value: 'description', label: 'Include description' },
    { value: 'prompt', label: 'Generate diagram prompt' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-enable LaTeX for maths/science
    if (field === 'subject') {
      const mathSubjects = ['Maths', 'Physics', 'Chemistry', 'Combined Science'];
      setFormData(prev => ({
        ...prev,
        [field]: value,
        include_latex: mathSubjects.includes(value)
      }));
    }
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await axios.post(`${API}/teacher/questions/ai-generate`, formData);
      const questionsData = response.data.questions || [];
      setGeneratedQuestions(questionsData);
      setSelectedQuestions(new Set());
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleQuestionSelection = (index) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleEditQuestion = (index, field, value) => {
    setGeneratedQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveSelected = async () => {
    const questionsToSave = generatedQuestions.filter((_, index) => selectedQuestions.has(index));

    try {
      for (const q of questionsToSave) {
        await axios.post(`${API}/teacher/questions`, {
          subject: q.subject,
          exam_type: `${q.key_stage} ${q.exam_board} ${q.tier}`,
          topic: q.topic_tags?.join(', ') || formData.topic,
          question_text: q.question_text,
          max_marks: q.marks_total,
          mark_scheme: typeof q.mark_scheme === 'string' ? q.mark_scheme : JSON.stringify(q.mark_scheme),
          source: 'ai_generated',
          key_stage: q.key_stage,
          exam_board: q.exam_board,
          tier: q.tier,
          question_title: q.question_title,
          topic_tags: q.topic_tags,
          mark_scheme_json: Array.isArray(q.mark_scheme) ? q.mark_scheme : null,
          model_answer: q.model_answer,
          common_mistakes: q.common_mistakes,
          keywords: q.keywords,
          diagram_prompt: q.diagram_prompt,
          quality_score: q.quality_score,
          quality_notes: q.quality_notes,
          calculator_allowed: q.calculator_allowed || formData.calculator_allowed
        });
      }

      onQuestionsGenerated();
      setGeneratedQuestions([]);
      setSelectedQuestions(new Set());
    } catch (err) {
      setError('Failed to save questions');
    }
  };

  const openMathKeyboard = (field) => {
    setActiveField(field);
    setShowMathKeyboard(true);
  };

  const insertMath = (latex) => {
    if (activeField) {
      handleChange(activeField, formData[activeField] + latex);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">AI Question Generator</h3>
            <p className="text-sm text-gray-600 mt-1">Generate curriculum-aligned questions with professional mark schemes</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              Phase 2 ✨
            </span>
          </div>
        </div>

        {/* Phase 2 Features Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">✨ Enhanced Features:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-800">
            <div>
              <span className="font-medium">📋 Subject-Specific Templates</span>
              <p className="text-blue-700">Mark schemes follow exam board standards</p>
            </div>
            <div>
              <span className="font-medium">📐 Diagram Generation</span>
              <p className="text-blue-700">Auto-generated diagram prompts for visual questions</p>
            </div>
            <div>
              <span className="font-medium">⭐ Quality Scoring</span>
              <p className="text-blue-700">AI-powered quality assessment on 6 criteria</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-subject"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Key Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Stage</label>
            <select
              value={formData.key_stage}
              onChange={(e) => handleChange('key_stage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-key-stage"
            >
              {keyStages.map(ks => <option key={ks} value={ks}>{ks}</option>)}
            </select>
          </div>

          {/* Exam Board */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Board</label>
            <select
              value={formData.exam_board}
              onChange={(e) => handleChange('exam_board', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-exam-board"
            >
              {examBoards.map(eb => <option key={eb} value={eb}>{eb}</option>)}
            </select>
          </div>

          {/* Tier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
            <select
              value={formData.tier}
              onChange={(e) => handleChange('tier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-tier"
            >
              {tiers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Topic */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => handleChange('topic', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Quadratic equations"
                data-testid="ai-topic"
              />
              <button
                onClick={() => openMathKeyboard('topic')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                title="Math Keyboard"
              >
                𝑓(𝑥)
              </button>
            </div>
          </div>

          {/* Subtopic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic (optional)</label>
            <input
              type="text"
              value={formData.subtopic}
              onChange={(e) => handleChange('subtopic', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Factorising"
              data-testid="ai-subtopic"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-difficulty"
            >
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select
              value={formData.question_type}
              onChange={(e) => handleChange('question_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-question-type"
            >
              {questionTypes.map(qt => <option key={qt} value={qt}>{qt}</option>)}
            </select>
          </div>

          {/* Marks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marks (1-20)</label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.marks}
              onChange={(e) => handleChange('marks', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-marks"
            />
          </div>

          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.num_questions}
              onChange={(e) => handleChange('num_questions', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-num-questions"
            />
          </div>

          {/* Include Diagrams */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Include Diagrams</label>
            <select
              value={formData.include_diagrams}
              onChange={(e) => handleChange('include_diagrams', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              data-testid="ai-diagrams"
            >
              {diagramOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Checkboxes Row */}
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.include_latex}
              onChange={(e) => handleChange('include_latex', e.target.checked)}
              className="rounded"
              data-testid="ai-latex"
            />
            <span className="text-sm text-gray-700">Include LaTeX formatting</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.calculator_allowed}
              onChange={(e) => handleChange('calculator_allowed', e.target.checked)}
              className="rounded"
              data-testid="ai-calculator"
            />
            <span className="text-sm text-gray-700">Calculator allowed</span>
          </label>
        </div>

        {/* Command Words */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Command Words (optional, comma-separated)</label>
          <input
            type="text"
            value={formData.command_words}
            onChange={(e) => handleChange('command_words', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Calculate, Explain, Evaluate"
            data-testid="ai-command-words"
          />
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={generating || !formData.topic.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            data-testid="generate-btn"
          >
            {generating ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Generated Questions Preview */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Generated Questions ({generatedQuestions.length})</h3>
            <button
              onClick={handleSaveSelected}
              disabled={selectedQuestions.size === 0}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
              data-testid="save-selected-btn"
            >
              Save Selected ({selectedQuestions.size})
            </button>
          </div>

          <div className="space-y-6">
            {generatedQuestions.map((q, index) => (
              <div key={index} className="border rounded-lg p-4" data-testid={`generated-question-${index}`}>
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.has(index)}
                    onChange={() => toggleQuestionSelection(index)}
                    className="mt-1"
                    data-testid={`select-question-${index}`}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{q.question_title || `Question ${index + 1}`}</h4>
                      <span className="text-sm text-gray-600">{q.marks_total} marks</span>
                    </div>

                    {/* Question Text (Editable) */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                      <textarea
                        value={q.question_text}
                        onChange={(e) => handleEditQuestion(index, 'question_text', e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                      />
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Preview:</p>
                        <LaTeXRenderer text={q.question_text} />
                      </div>
                    </div>

                    {/* Mark Scheme */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Mark Scheme:</p>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {Array.isArray(q.mark_scheme) && q.mark_scheme.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {q.mark_scheme.map((item, i) => (
                              <li key={i}>
                                <span className="font-medium">M{item.mark}:</span> <LaTeXRenderer text={item.point || ''} />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <LaTeXRenderer text={q.mark_scheme || 'No mark scheme available'} />
                        )}
                      </div>
                    </div>

                    {/* Model Answer */}
                    {q.model_answer && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Model Answer:</p>
                        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded">
                          <LaTeXRenderer text={q.model_answer} />
                        </div>
                      </div>
                    )}

                    {/* Quality Score with Visual Indicator */}
                    {q.quality_score !== undefined && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Quality Score:</span>
                            <span className={`text-lg font-bold ${
                              q.quality_score >= 85 ? 'text-green-600' :
                              q.quality_score >= 70 ? 'text-blue-600' :
                              q.quality_score >= 55 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>{q.quality_score}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                q.quality_score >= 85 ? 'bg-green-600' :
                                q.quality_score >= 70 ? 'bg-blue-600' :
                                q.quality_score >= 55 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${q.quality_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quality Notes */}
                    {q.quality_notes && Array.isArray(q.quality_notes) && q.quality_notes.length > 0 && (
                      <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs font-medium text-blue-900 mb-1">Quality Assessment:</p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          {q.quality_notes.map((note, i) => (
                            <li key={i}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Diagram Prompt (if present) */}
                    {q.diagram_prompt && (
                      <div className="mb-3 p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="text-sm font-medium text-purple-900 mb-1">📐 Diagram Required:</p>
                        <p className="text-sm text-purple-800">{q.diagram_prompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Math Keyboard Modal */}
      {showMathKeyboard && (
        <MathKeyboard
          onInsert={insertMath}
          onClose={() => setShowMathKeyboard(false)}
        />
      )}
    </div>
  );
};

export default AIQuestionGenerator;
