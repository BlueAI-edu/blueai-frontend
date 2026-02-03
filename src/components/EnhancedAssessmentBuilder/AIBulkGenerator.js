import React, { useState } from 'react';
import axios from 'axios';
import { API } from '@/config';

const AIBulkGenerator = ({ onQuestionsGenerated, assessmentMode }) => {
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    key_stage: 'KS4',
    exam_board: 'AQA',
    tier: 'Higher',
    topic: '',
    subtopic: '',
    difficulty: 'Medium',
    num_questions: 5,
    question_types: [],
    total_marks: 40,
    include_latex: true,
    calculator_allowed: false,
    context: 'mock exam'
  });
  const [error, setError] = useState('');

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History'];
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

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    if (formData.num_questions < 3 || formData.num_questions > 20) {
      setError('Number of questions must be between 3 and 20');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await axios.post(`${API}/teacher/questions/ai-generate-multi`, formData);
      
      if (response.data.success) {
        onQuestionsGenerated(response.data.questions);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🤖</div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">AI Bulk Question Generator</h3>
            <p className="text-sm text-gray-600">
              Generate multiple exam-quality questions at once. Specify your requirements and let AI create a complete set of questions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {keyStages.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Exam Board */}
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

        {/* Tier */}
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

      {/* Topic */}
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

      {/* Subtopic */}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Difficulty */}
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

        {/* Number of Questions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
          <input
            type="number"
            min="3"
            max="20"
            value={formData.num_questions}
            onChange={(e) => handleChange('num_questions', parseInt(e.target.value) || 5)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Total Marks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
          <input
            type="number"
            min="10"
            max="100"
            value={formData.total_marks}
            onChange={(e) => handleChange('total_marks', parseInt(e.target.value) || 40)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Question Types */}
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
            Generating {formData.num_questions} questions...
          </span>
        ) : (
          `🤖 Generate ${formData.num_questions} Questions with AI`
        )}
      </button>
    </div>
  );
};

export default AIBulkGenerator;
