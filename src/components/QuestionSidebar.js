import React from 'react';
import { formatTime } from '../hooks/use-timer';

const QuestionSidebar = ({
  assessment,
  timeLeft,
  answers,
  currentQuestionIndex,
  flaggedQuestions = new Set(),
  onGoToQuestion,
  onToggleFlag,
  onSubmit,
  submitting,
  isSaving,
  answerProgress,
}) => {
  const { answeredCount, totalItems } = answerProgress;
  const flaggedCount = flaggedQuestions.size;

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-screen sticky top-0">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{assessment.title}</h2>
        <p className="text-sm text-gray-600">{assessment.subject}</p>
        {assessment.totalMarks && (
          <p className="text-sm text-gray-600">Total: {assessment.totalMarks} marks</p>
        )}
      </div>

      {/* Timer */}
      {timeLeft !== null && (
        <div className={`mb-4 p-3 rounded-lg ${timeLeft < 300 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <p className="text-xs text-gray-600 mb-1">Time Remaining</p>
          <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
            {formatTime(timeLeft)}
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-gray-600">
            {answeredCount} / {totalItems} answered
          </p>
          {flaggedCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="none" />
              </svg>
              {flaggedCount} flagged
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${totalItems > 0 ? (answeredCount / totalItems) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Questions</p>
        {assessment.questions.map((q, index) => {
          const isStructured = q.questionType === 'STRUCTURED_WITH_PARTS' && q.parts && q.parts.length > 0;
          const isCurrent = index === currentQuestionIndex;
          const isFlagged = flaggedQuestions.has(index);

          let isAnswered;
          if (isStructured) {
            isAnswered = q.parts.every(part => {
              const partKey = `${q.questionNumber}-${part.partLabel}`;
              return answers[partKey]?.trim();
            });
          } else {
            isAnswered = answers[q.questionNumber]?.trim();
          }

          return (
            <div key={q.questionNumber}>
              <button
                onClick={() => onGoToQuestion(index)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isFlagged
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : isAnswered
                    ? 'bg-green-50 border-green-300 text-green-900 hover:bg-green-100'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Question {q.questionNumber}</span>
                  <div className="flex items-center gap-1.5">
                    {isFlagged && !isCurrent && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFlag?.(index); }}
                        title="Remove flag"
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" stroke="currentColor" fill="none" />
                        </svg>
                      </button>
                    )}
                    {isAnswered && !isCurrent && !isFlagged && (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {isAnswered && isFlagged && !isCurrent && (
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                {q.maxMarks && (
                  <p className={`text-xs mt-1 ${isCurrent ? 'text-blue-100' : 'text-gray-500'}`}>
                    {q.maxMarks} marks
                  </p>
                )}
                {isStructured && (
                  <p className={`text-xs mt-1 ${isCurrent ? 'text-blue-100' : 'text-gray-500'}`}>
                    {q.parts.length} parts (a-{String.fromCharCode(96 + q.parts.length)})
                  </p>
                )}
                {isFlagged && !isCurrent && (
                  <p className="text-xs mt-1 text-amber-600 font-medium">Review later</p>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>

        {isSaving && (
          <p className="text-xs text-gray-500 text-center mt-2">Auto-saving...</p>
        )}
      </div>
    </div>
  );
};

export default React.memo(QuestionSidebar);
