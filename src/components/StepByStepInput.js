import React, { useState } from 'react';
import LaTeXRenderer from './LaTeXRenderer';
import StudentMathKeyboard from './StudentMathKeyboard';

const StepByStepInput = ({ onSubmit, maxSteps = 10 }) => {
  const [steps, setSteps] = useState([
    { id: 1, description: '', calculation: '', explanation: '', isCorrect: null }
  ]);
  const [activeStep, setActiveStep] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  const addStep = () => {
    if (steps.length < maxSteps) {
      setSteps([
        ...steps,
        {
          id: steps.length + 1,
          description: '',
          calculation: '',
          explanation: '',
          isCorrect: null
        }
      ]);
      setActiveStep(steps.length);
    }
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Renumber steps
      const renumbered = newSteps.map((step, i) => ({ ...step, id: i + 1 }));
      setSteps(renumbered);
      if (activeStep >= newSteps.length) {
        setActiveStep(newSteps.length - 1);
      }
    }
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleKeyboardInsert = (text, cursorOffset) => {
    if (activeField) {
      const { stepIndex, field } = activeField;
      const currentValue = steps[stepIndex][field];
      const newValue = currentValue + text;
      updateStep(stepIndex, field, newValue);
    }
  };

  const openKeyboard = (stepIndex, field) => {
    setActiveField({ stepIndex, field });
    setShowKeyboard(true);
  };

  const handleSubmitSteps = () => {
    const formattedSteps = steps.map(step => ({
      stepNumber: step.id,
      description: step.description,
      calculation: step.calculation,
      explanation: step.explanation
    }));

    onSubmit(formattedSteps);
  };

  const getStepIcon = (step) => {
    if (step.isCorrect === true) return '✅';
    if (step.isCorrect === false) return '❌';
    return '📝';
  };

  const getStepColor = (step) => {
    if (step.isCorrect === true) return 'border-green-300 bg-green-50';
    if (step.isCorrect === false) return 'border-red-300 bg-red-50';
    return 'border-gray-300 bg-white';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">📋 Step-by-Step Solution</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Show Preview</span>
          </label>
          <button
            onClick={addStep}
            disabled={steps.length >= maxSteps}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            + Add Step
          </button>
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(index)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeStep === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getStepIcon(step)} Step {step.id}
          </button>
        ))}
      </div>

      {/* Active Step Form */}
      <div className={`border-2 rounded-lg p-4 ${getStepColor(steps[activeStep])}`}>
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-semibold text-gray-900">
            {getStepIcon(steps[activeStep])} Step {steps[activeStep].id}
          </h4>
          {steps.length > 1 && (
            <button
              onClick={() => removeStep(activeStep)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          )}
        </div>

        {/* Step Description */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What are you doing in this step?
          </label>
          <input
            type="text"
            value={steps[activeStep].description}
            onChange={(e) => updateStep(activeStep, 'description', e.target.value)}
            placeholder="e.g., Expand brackets, Collect like terms, Solve for x"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Calculation */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Your calculation
            </label>
            <button
              onClick={() => openKeyboard(activeStep, 'calculation')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              🔢 Math Keyboard
            </button>
          </div>
          <textarea
            value={steps[activeStep].calculation}
            onChange={(e) => updateStep(activeStep, 'calculation', e.target.value)}
            placeholder="Enter your mathematical work here (use $ for LaTeX, e.g., $x^2 + 2x + 1$)"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Preview */}
        {showPreview && steps[activeStep].calculation && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-medium text-blue-700 mb-1">Preview:</p>
            <div className="bg-white p-2 rounded">
              <LaTeXRenderer latex={steps[activeStep].calculation} />
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Explain your working (optional)
          </label>
          <textarea
            value={steps[activeStep].explanation}
            onChange={(e) => updateStep(activeStep, 'explanation', e.target.value)}
            placeholder="Explain why you did this step..."
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Feedback (if marked) */}
        {steps[activeStep].isCorrect !== null && (
          <div
            className={`p-3 rounded-lg ${
              steps[activeStep].isCorrect
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <p className="font-medium">
              {steps[activeStep].isCorrect ? '✅ This step is correct!' : '❌ This step has an error'}
            </p>
            {steps[activeStep].feedback && (
              <p className="text-sm mt-1">{steps[activeStep].feedback}</p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const newSteps = [...steps];
            newSteps[activeStep].description = 'Given';
            setSteps(newSteps);
          }}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
        >
          + Given
        </button>
        <button
          onClick={() => {
            const newSteps = [...steps];
            newSteps[activeStep].description = 'Substitute values';
            setSteps(newSteps);
          }}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
        >
          + Substitute
        </button>
        <button
          onClick={() => {
            const newSteps = [...steps];
            newSteps[activeStep].description = 'Simplify';
            setSteps(newSteps);
          }}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
        >
          + Simplify
        </button>
        <button
          onClick={() => {
            const newSteps = [...steps];
            newSteps[activeStep].description = 'Final answer';
            setSteps(newSteps);
          }}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
        >
          + Final Answer
        </button>
      </div>

      {/* Summary */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-2">Solution Summary</h4>
        <div className="space-y-2 text-sm">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-2">
              <span className="font-medium text-gray-600">Step {step.id}:</span>
              <span className="text-gray-700">
                {step.description || '(No description)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitSteps}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
      >
        Submit Solution for Checking
      </button>

      {/* Math Keyboard Modal */}
      {showKeyboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <StudentMathKeyboard
              onInsert={handleKeyboardInsert}
              onClose={() => setShowKeyboard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StepByStepInput;
