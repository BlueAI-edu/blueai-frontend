import React, { useState } from 'react';
import LaTeXRenderer from '../LaTeXRenderer';

const StructuredQuestionBuilder = ({ parts, onPartsChange, questionNumber }) => {
  const getNextPartLabel = () => {
    const labels = 'abcdefghijklmnopqrstuvwxyz';
    return labels[parts.length] || String.fromCharCode(97 + parts.length);
  };

  const addPart = () => {
    const newPart = {
      partLabel: getNextPartLabel(),
      partPrompt: '',
      maxMarks: 1,
      answerType: 'TEXT',
      markScheme: '',
      correctAnswer: ''
    };
    onPartsChange([...parts, newPart]);
  };

  const removePart = (index) => {
    const newParts = parts.filter((_, i) => i !== index);
    // Re-label remaining parts
    const relabeled = newParts.map((part, i) => ({
      ...part,
      partLabel: String.fromCharCode(97 + i) // a, b, c, d...
    }));
    onPartsChange(relabeled);
  };

  const updatePart = (index, field, value) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    onPartsChange(newParts);
  };

  const movePart = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= parts.length) return;

    const newParts = [...parts];
    [newParts[index], newParts[newIndex]] = [newParts[newIndex], newParts[index]];
    
    // Re-label after move
    const relabeled = newParts.map((part, i) => ({
      ...part,
      partLabel: String.fromCharCode(97 + i)
    }));
    onPartsChange(relabeled);
  };

  const totalMarks = parts.reduce((sum, part) => sum + (part.maxMarks || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-gray-900">Question {questionNumber} Parts</h4>
          <p className="text-sm text-gray-600">Add sub-parts (a, b, c...) - auto-labeled</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Marks</div>
          <div className="text-2xl font-bold text-blue-600">{totalMarks}</div>
        </div>
      </div>

      {parts.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-3">No parts yet. Add your first sub-part.</p>
          <button
            onClick={addPart}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Part (a)
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {parts.map((part, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold text-lg">
                    {part.partLabel}
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Part Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part ({part.partLabel}) Question
                    </label>
                    <textarea
                      value={part.partPrompt}
                      onChange={(e) => updatePart(index, 'partPrompt', e.target.value)}
                      placeholder="Enter the question for this part..."
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Marks and Answer Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={part.maxMarks}
                        onChange={(e) => updatePart(index, 'maxMarks', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Answer Type</label>
                      <select
                        value={part.answerType}
                        onChange={(e) => updatePart(index, 'answerType', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="TEXT">Text</option>
                        <option value="NUMERIC">Numeric</option>
                        <option value="MATHS">Maths (LaTeX)</option>
                        <option value="MIXED">Mixed</option>
                      </select>
                    </div>
                  </div>

                  {/* Mark Scheme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mark Scheme</label>
                    <textarea
                      value={part.markScheme}
                      onChange={(e) => updatePart(index, 'markScheme', e.target.value)}
                      placeholder="How should this part be marked?"
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Part Actions */}
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => movePart(index, 'up')}
                    disabled={index === 0}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => movePart(index, 'down')}
                    disabled={index === parts.length - 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removePart(index)}
                    className="p-2 rounded hover:bg-red-100 text-red-600"
                    title="Remove part"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addPart}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            + Add Part ({getNextPartLabel()})
          </button>
        </div>
      )}
    </div>
  );
};

export default StructuredQuestionBuilder;
