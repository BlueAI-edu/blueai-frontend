import React, { useState } from 'react';

const MCQEditor = ({ options, onOptionsChange, allowMultiSelect, onMultiSelectChange }) => {
  const labels = ['A', 'B', 'C', 'D'];

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onOptionsChange(newOptions);
  };

  const handleCorrectChange = (index) => {
    const newOptions = [...options];
    if (allowMultiSelect) {
      // Multi-select: toggle
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    } else {
      // Single select: only one can be correct
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    }
    onOptionsChange(newOptions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Multiple Choice Options</h4>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allowMultiSelect}
            onChange={(e) => onMultiSelectChange(e.target.checked)}
            className="rounded"
          />
          <span>Allow multiple correct answers</span>
        </label>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
            <button
              onClick={() => handleCorrectChange(index)}
              className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-colors ${
                option.isCorrect
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-white border-gray-300 text-gray-400 hover:border-green-400'
              }`}
              title={option.isCorrect ? 'Correct answer' : 'Mark as correct'}
            >
              {option.isCorrect && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-gray-700 text-lg">{labels[index]}</span>
                <span className="text-xs text-gray-500">Click ✓ to mark correct</span>
              </div>
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                placeholder={`Option ${labels[index]} text...`}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      {!allowMultiSelect && !options.some(o => o.isCorrect) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          ⚠️ Please mark at least one option as correct
        </div>
      )}

      {allowMultiSelect && options.filter(o => o.isCorrect).length < 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          💡 Multi-select mode: Mark 2 or more options as correct
        </div>
      )}
    </div>
  );
};

export default MCQEditor;
