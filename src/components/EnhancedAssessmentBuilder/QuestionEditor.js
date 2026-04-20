import React, { useState } from 'react';
import QuestionTypeSelector from './QuestionTypeSelector';
import MCQEditor from './MCQEditor';
import StructuredQuestionBuilder from './StructuredQuestionBuilder';
import StimulusUploader from './StimulusUploader';
import AIBulkGenerator from './AIBulkGenerator';
import MixedMathEditor from '../MixedMathEditor';

const LONG_RESPONSE_MIN_MARKS = 6;
const LONG_RESPONSE_MAX_MARKS = 15;

const QuestionEditor = ({
  question,
  questionIndex,
  onQuestionChange,
  onRemove,
  assessmentMode,
  assessmentId
}) => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'ai'

  const updateQuestion = (field, value) => {
    onQuestionChange(questionIndex, { ...question, [field]: value });
  };

  const handleAIQuestionsGenerated = (questions) => {
    if (questions && questions.length > 0) {
      const aiQuestion = questions[0];
      onQuestionChange(questionIndex, {
        ...question,
        ...aiQuestion,
        questionNumber: question.questionNumber
      });
      setActiveTab('manual');
    }
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

      {/* Manual/AI Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
          >
            ✍️ Write Manually
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
          >
            🤖 Generate with AI
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'manual' ? (
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
                {/* Stimulus Uploader (for GCSE Structured) */}
                {question.questionType === 'STRUCTURED_WITH_PARTS' && assessmentId && (
                  <StimulusUploader
                    assessmentId={assessmentId}
                    questionNumber={question.questionNumber}
                    currentStimulus={question.stimulusBlock}
                    onStimulusUploaded={(stimulus) => updateQuestion('stimulusBlock', stimulus)}
                  />
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
                      updateQuestion('parts', parts);
                      const totalMarks = parts.reduce((sum, p) => sum + (p.maxMarks || 0), 0);
                      updateQuestion('maxMarks', totalMarks);
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
                            <span className="ml-1 text-xs text-blue-600 font-normal">(6–15 required)</span>
                          )}
                        </label>
                        <input
                          type="number"
                          min={getMarksConfig().min}
                          max={getMarksConfig().max}
                          value={question.maxMarks || 1}
                          onChange={(e) => handleMarksChange(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            marksOutOfRange ? 'border-red-400 bg-red-50' : ''
                          }`}
                        />
                        {marksOutOfRange && (
                          <p className="mt-1 text-xs text-red-600">
                            Long response questions must be {LONG_RESPONSE_MIN_MARKS}–{LONG_RESPONSE_MAX_MARKS} marks.
                          </p>
                        )}
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
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={question.calculatorAllowed || false}
                      onChange={(e) => updateQuestion('calculatorAllowed', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Calculator allowed</span>
                  </label>
                </div>
              </>
            )}
          </>
        ) : (
          /* AI Generation Tab */
          <div>
            <AIBulkGenerator
              onQuestionsGenerated={handleAIQuestionsGenerated}
              assessmentMode={assessmentMode}
            />
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              AI will generate a question based on your specifications. You can edit it after generation.
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default React.memo(QuestionEditor);
