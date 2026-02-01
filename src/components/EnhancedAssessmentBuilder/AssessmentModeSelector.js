import React from 'react';

const AssessmentModeSelector = ({ selectedMode, onModeChange }) => {
  const modes = [
    {
      id: 'CLASSIC',
      name: '📝 Classic Mode',
      description: 'Single question assessment (backward compatible)',
      duration: '30-60 min',
      questions: '1 question',
      icon: '📝',
      color: 'bg-gray-100 border-gray-300 hover:bg-gray-200'
    },
    {
      id: 'FORMATIVE_SINGLE_LONG_RESPONSE',
      name: '📋 Formative Assessment',
      description: 'Single extended response question for mastery checks',
      duration: '30-60 min',
      questions: '1 question (6+ marks)',
      icon: '📋',
      color: 'bg-blue-50 border-blue-300 hover:bg-blue-100'
    },
    {
      id: 'SUMMATIVE_MULTI_QUESTION',
      name: '📊 Summative Assessment',
      description: 'Multiple questions of mixed types (MCQ, short answer, calculations)',
      duration: '30-60 min',
      questions: '5-10 questions',
      icon: '📊',
      color: 'bg-green-50 border-green-300 hover:bg-green-100'
    },
    {
      id: 'EXAM_STRUCTURED_GCSE_STYLE',
      name: '📄 GCSE Structured Exam',
      description: 'Exam-style questions with sub-parts (1a, 1b, 1c) and shared stimulus',
      duration: '30-60 min',
      questions: '1-5 structured questions',
      icon: '📄',
      color: 'bg-purple-50 border-purple-300 hover:bg-purple-100'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Assessment Type</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose the type of assessment you want to create. This determines the structure and student experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selectedMode === mode.id
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                : mode.color
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{mode.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{mode.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{mode.description}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>⏱️ {mode.duration}</span>
                  <span>📝 {mode.questions}</span>
                </div>
              </div>
              {selectedMode === mode.id && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AssessmentModeSelector;
