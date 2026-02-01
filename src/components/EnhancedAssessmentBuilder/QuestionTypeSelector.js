import React from 'react';

const QuestionTypeSelector = ({ selectedType, onTypeChange, mode }) => {
  const questionTypes = [
    {
      id: 'SHORT_ANSWER',
      name: 'Short Answer',
      description: '1-3 marks, brief written response',
      icon: '✍️',
      marks: '1-3',
      available: ['SUMMATIVE_MULTI_QUESTION', 'EXAM_STRUCTURED_GCSE_STYLE']
    },
    {
      id: 'MULTIPLE_CHOICE',
      name: 'Multiple Choice',
      description: 'A-D options, single correct answer',
      icon: '🔘',
      marks: '1',
      available: ['SUMMATIVE_MULTI_QUESTION']
    },
    {
      id: 'MULTI_SELECT',
      name: 'Multi-Select',
      description: 'Multiple correct answers possible',
      icon: '☑️',
      marks: '2-3',
      available: ['SUMMATIVE_MULTI_QUESTION']
    },
    {
      id: 'NUMERIC',
      name: 'Numeric Answer',
      description: 'Calculation question with numeric answer',
      icon: '🔢',
      marks: '1-3',
      available: ['SUMMATIVE_MULTI_QUESTION', 'EXAM_STRUCTURED_GCSE_STYLE']
    },
    {
      id: 'LONG_RESPONSE',
      name: 'Long Response',
      description: 'Extended written answer (6+ marks)',
      icon: '📝',
      marks: '6+',
      available: ['FORMATIVE_SINGLE_LONG_RESPONSE', 'SUMMATIVE_MULTI_QUESTION', 'EXAM_STRUCTURED_GCSE_STYLE']
    },
    {
      id: 'STRUCTURED_WITH_PARTS',
      name: 'GCSE Structured',
      description: 'Question with sub-parts (1a, 1b, 1c...)',
      icon: '📄',
      marks: 'varies',
      available: ['EXAM_STRUCTURED_GCSE_STYLE']
    }
  ];

  const availableTypes = questionTypes.filter(type => type.available.includes(mode));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {availableTypes.map((type) => (
        <button
          key={type.id}
          onClick={() => onTypeChange(type.id)}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            selectedType === type.id
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <div className="text-2xl mb-2">{type.icon}</div>
          <div className="font-medium text-gray-900 text-sm mb-1">{type.name}</div>
          <div className="text-xs text-gray-600 mb-2">{type.description}</div>
          <div className="text-xs text-blue-600 font-medium">{type.marks} marks</div>
        </button>
      ))}
    </div>
  );
};

export default QuestionTypeSelector;
