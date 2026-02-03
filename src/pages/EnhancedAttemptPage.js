import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StudentMathInput from '../components/StudentMathInput';
import StudentCalculator from '../components/StudentCalculator';
import LaTeXRenderer from '../components/LaTeXRenderer';
import { API } from '@/config';

export const EnhancedAttemptPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [attempt, setAttempt] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Question navigation
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionNumber: answerText }
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef(null);
  
  // Confirmation modal state
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  // Timer countdown
  useEffect(() => {
    if (!assessment?.durationMinutes || !assessment?.started_at || showFeedback) return;

    const startedAt = new Date(assessment.started_at);
    const duration = assessment.durationMinutes * 60 * 1000;
    const endTime = startedAt.getTime() + duration;

    // Initialize immediately
    const now = Date.now();
    const initialRemaining = endTime - now;
    if (initialRemaining > 0) {
      setTimeLeft(Math.floor(initialRemaining / 1000));
    } else {
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmit(true); // Auto-submit
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment, showFeedback]);

  // Auto-save answers
  useEffect(() => {
    if (!attempt || showFeedback) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer to save after 3 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveAnswers();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [answers]);

  const loadAttempt = async () => {
    try {
      console.log('Loading enhanced attempt:', attemptId);
      const response = await axios.get(`${API}/public/enhanced-attempt/${attemptId}`);
      console.log('Attempt data:', response.data);
      
      setAttempt(response.data.attempt);
      setAssessment(response.data.assessment);
      
      // Load existing answers if any
      if (response.data.attempt.answers) {
        setAnswers(response.data.attempt.answers);
      }
      
      if (response.data.attempt.status === 'marked') {
        setShowFeedback(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading attempt:', error);
      alert('Failed to load assessment. Please check your link.');
      setLoading(false);
    }
  };

  const autoSaveAnswers = async () => {
    if (isAutoSaving || !attempt) return;
    
    setIsAutoSaving(true);
    try {
      await axios.post(`${API}/public/enhanced-attempt/${attemptId}/autosave`, { answers });
      console.log('Auto-saved answers');
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleAnswerChange = (questionNumber, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && submitting) return;
    
    // For manual submit, show confirmation modal
    if (!autoSubmit) {
      setShowSubmitConfirm(true);
      return;
    }
    
    // Proceed with submission
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
      
      console.log('Submit response:', response.data);
      
      // Update both attempt and assessment from response
      setAttempt(response.data.attempt);
      if (response.data.assessment) {
        setAssessment(response.data.assessment);
      }
      setShowFeedback(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.response?.data?.detail || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    let answeredCount = 0;
    let totalItems = 0;
    
    assessment.questions.forEach(q => {
      if (q.questionType === 'STRUCTURED_WITH_PARTS' && q.parts && q.parts.length > 0) {
        // Count each part separately
        totalItems += q.parts.length;
        q.parts.forEach(part => {
          const partKey = `${q.questionNumber}-${part.partLabel}`;
          if (answers[partKey]?.trim()) {
            answeredCount++;
          }
        });
      } else {
        // Count whole question
        totalItems += 1;
        if (answers[q.questionNumber]?.trim()) {
          answeredCount++;
        }
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

  // Safety check: ensure questions array exists
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
    return <FeedbackView attempt={attempt} assessment={assessment} />;
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  
  // Safety check: ensure current question exists
  if (!currentQuestion) {
    console.error('Current question not found:', { currentQuestionIndex, totalQuestions: assessment.questions.length });
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
      {/* Question Navigation Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{assessment.title}</h2>
          <p className="text-sm text-gray-600">{assessment.subject}</p>
          {assessment.totalMarks && (
            <p className="text-sm text-gray-600">Total: {assessment.totalMarks} marks</p>
          )}
        </div>

        {/* Timer */}
        {timeLeft !== null && (
          <div className={`mb-6 p-3 rounded-lg ${timeLeft < 300 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            <p className="text-xs text-gray-600 mb-1">Time Remaining</p>
            <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Progress: {getAnsweredCount().answeredCount} / {getAnsweredCount().totalItems}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(getAnsweredCount().answeredCount / getAnsweredCount().totalItems) * 100}%` }}
            />
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Questions</p>
          {assessment.questions.map((q, index) => {
            const isStructured = q.questionType === 'STRUCTURED_WITH_PARTS' && q.parts && q.parts.length > 0;
            const isCurrent = index === currentQuestionIndex;
            
            // For structured questions, check if all parts are answered
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
                  onClick={() => goToQuestion(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isAnswered
                      ? 'bg-green-50 border-green-300 text-green-900 hover:bg-green-100'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Question {q.questionNumber}</span>
                    {isAnswered && !isCurrent && (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
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
                </button>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="w-full mt-6 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>

        {isAutoSaving && (
          <p className="text-xs text-gray-500 text-center mt-2">Auto-saving...</p>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Question Header */}
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

            {/* Question Body */}
            <div className="prose max-w-none">
              <LaTeXRenderer text={currentQuestion.questionBody || ''} />
            </div>

            {/* Structured Question Parts (GCSE Style) */}
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
                      
                      {/* Part Answer Input */}
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

            {/* Question Type Specific Info (for non-structured questions) */}
            {currentQuestion.questionType === 'MULTIPLE_CHOICE' && currentQuestion.options && (
              <div className="mt-6 space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  // Ensure option is a string
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

          {/* Answer Input Area - Only for non-MCQ and non-Structured questions */}
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
                <span className="text-2xl">⚠️</span>
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

// Feedback View Component
const FeedbackView = ({ attempt, assessment }) => {
  const feedbackReleased = attempt.feedback_released || false;
  const isFormative = assessment.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE';

  if (!feedbackReleased) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submission Received!</h1>
            <p className="text-lg text-gray-600 mb-6">Thank you, {attempt.student_name}</p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700">
                Your answers have been submitted successfully and are being reviewed by your teacher.
              </p>
              <p className="text-gray-700 mt-4">
                Your teacher will review your work and release feedback when ready. Please check back later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show feedback (will be enhanced later with actual feedback rendering)
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Assessment Results</h1>
          
          {!isFormative && attempt.score !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-1">Your Score</p>
              <p className="text-4xl font-bold text-blue-600">
                {attempt.score} / {assessment.totalMarks}
              </p>
            </div>
          )}

          {attempt.www && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-700 mb-2">✅ What Went Well (WWW)</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{attempt.www}</p>
            </div>
          )}

          {attempt.next_steps && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-orange-700 mb-2">📈 Even Better If / Next Steps (EBI)</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{attempt.next_steps}</p>
            </div>
          )}

          {attempt.overall_feedback && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">💬 Overall Feedback</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{attempt.overall_feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAttemptPage;
