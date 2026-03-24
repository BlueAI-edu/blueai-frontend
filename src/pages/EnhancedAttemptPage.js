import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import StudentMathInput from '../components/StudentMathInput';
import LaTeXRenderer from '../components/LaTeXRenderer';
import EnhancedFeedbackView from '../components/EnhancedFeedbackView';
import QuestionSidebar from '../components/QuestionSidebar';
import { useTimer } from '../hooks/use-timer';
import { useAutosave } from '../hooks/use-autosave';
import { API } from '@/config';
import { handleApiError } from '@/lib/handle-error';

export const EnhancedAttemptPage = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const { timeLeft } = useTimer({
    startedAt: assessment?.started_at,
    durationMinutes: assessment?.durationMinutes,
    enabled: !showFeedback,
    onExpire: () => handleSubmit(true),
  });

  const { isSaving } = useAutosave({
    attemptId,
    data: { answers },
    endpoint: `/public/enhanced-attempt/${attemptId}/autosave`,
    enabled: !!attempt && !showFeedback,
    mode: 'debounce',
    delay: 3000,
  });

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      const response = await axios.get(`${API}/public/enhanced-attempt/${attemptId}`);
      setAttempt(response.data.attempt);
      setAssessment(response.data.assessment);
      if (response.data.attempt.answers) {
        setAnswers(response.data.attempt.answers);
      }
      if (response.data.attempt.status === 'marked') {
        setShowFeedback(true);
      }
      setLoading(false);
    } catch (error) {
      handleApiError(error, 'Failed to load assessment');
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionNumber, value) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && submitting) return;
    if (!autoSubmit) {
      setShowSubmitConfirm(true);
      return;
    }
    await performSubmit(autoSubmit);
  };

  const performSubmit = async (autoSubmit = false) => {
    setSubmitting(true);
    setShowSubmitConfirm(false);
    try {
      const response = await axios.post(`${API}/public/enhanced-attempt/${attemptId}/submit`, {
        answers,
        autoSubmitted: autoSubmit
      });
      setAttempt(response.data.attempt);
      if (response.data.assessment) {
        setAssessment(response.data.assessment);
      }
      setShowFeedback(true);
    } catch (error) {
      handleApiError(error, 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const goToQuestion = (index) => setCurrentQuestionIndex(index);
  const goToNextQuestion = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
  };
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const getAnsweredCount = () => {
    let answeredCount = 0;
    let totalItems = 0;
    assessment.questions.forEach(q => {
      if (q.questionType === 'STRUCTURED_WITH_PARTS' && q.parts && q.parts.length > 0) {
        totalItems += q.parts.length;
        q.parts.forEach(part => {
          const partKey = `${q.questionNumber}-${part.partLabel}`;
          if (answers[partKey]?.trim()) answeredCount++;
        });
      } else {
        totalItems += 1;
        if (answers[q.questionNumber]?.trim()) answeredCount++;
      }
    });
    return { answeredCount, totalItems };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !assessment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-800">Assessment not found</p>
          <p className="text-gray-600 mt-2">Please check your link and try again.</p>
        </div>
      </div>
    );
  }

  if (!assessment.questions || !Array.isArray(assessment.questions) || assessment.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-800">No questions found</p>
          <p className="text-gray-600 mt-2">This assessment doesn't have any questions.</p>
        </div>
      </div>
    );
  }

  if (showFeedback) {
    return <EnhancedFeedbackView attempt={attempt} assessment={assessment} />;
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-800">Question not found</p>
          <p className="text-gray-600 mt-2">Unable to load question {currentQuestionIndex + 1}.</p>
        </div>
      </div>
    );
  }

  const isFormative = assessment.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <QuestionSidebar
        assessment={assessment}
        timeLeft={timeLeft}
        answers={answers}
        currentQuestionIndex={currentQuestionIndex}
        onGoToQuestion={goToQuestion}
        onSubmit={() => handleSubmit(false)}
        submitting={submitting}
        isSaving={isSaving}
        getAnsweredCount={getAnsweredCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Question {currentQuestion.questionNumber}
              </h2>
              <div className="flex items-center gap-4">
                {currentQuestion.maxMarks && !isFormative && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {currentQuestion.maxMarks} marks
                  </span>
                )}
                {currentQuestion.calculatorAllowed && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Calculator Allowed
                  </span>
                )}
              </div>
            </div>

            <div className="prose max-w-none">
              <LaTeXRenderer text={currentQuestion.questionBody || ''} />
            </div>

            {/* Structured Question Parts */}
            {currentQuestion.questionType === 'STRUCTURED_WITH_PARTS' && currentQuestion.parts && currentQuestion.parts.length > 0 && (
              <div className="mt-6 space-y-6">
                {currentQuestion.parts.map((part, idx) => {
                  const partAnswerKey = `${currentQuestion.questionNumber}-${part.partLabel}`;
                  return (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-blue-600">({part.partLabel})</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {part.maxMarks} {part.maxMarks === 1 ? 'mark' : 'marks'}
                            </span>
                          </div>
                          <div className="prose max-w-none">
                            <LaTeXRenderer text={part.partPrompt || ''} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <StudentMathInput
                          value={answers[partAnswerKey] || ''}
                          onChange={(value) => handleAnswerChange(partAnswerKey, value)}
                          placeholder={`Your answer for part ${part.partLabel}...`}
                          showKeyboard={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Multiple Choice */}
            {currentQuestion.questionType === 'MULTIPLE_CHOICE' && currentQuestion.options && (
              <div className="mt-6 space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const optionText = typeof option === 'string' ? option : (option.text || option.label || JSON.stringify(option));
                  return (
                    <label
                      key={idx}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        answers[currentQuestion.questionNumber] === optionText
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.questionNumber}`}
                        value={optionText}
                        checked={answers[currentQuestion.questionNumber] === optionText}
                        onChange={(e) => handleAnswerChange(currentQuestion.questionNumber, e.target.value)}
                        className="mr-3"
                      />
                      <LaTeXRenderer text={optionText} inline />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Answer Input for non-MCQ and non-Structured */}
          {currentQuestion.questionType !== 'MULTIPLE_CHOICE' &&
           currentQuestion.questionType !== 'STRUCTURED_WITH_PARTS' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Answer</h3>
              <StudentMathInput
                value={answers[currentQuestion.questionNumber] || ''}
                onChange={(value) => handleAnswerChange(currentQuestion.questionNumber, value)}
                placeholder="Type your answer here..."
                showKeyboard={true}
              />
              <p className="text-sm text-gray-500 mt-2">
                You can use the math keyboard to insert mathematical symbols and expressions.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {currentQuestionIndex < assessment.questions.length - 1 ? (
              <button
                onClick={goToNextQuestion}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="mb-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                <span className="text-2xl">Warning</span>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Submit Assessment?
              </h3>
              <p className="text-center text-gray-600">
                Are you sure you want to submit? You cannot change your answers after submission.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => performSubmit(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAttemptPage;
