import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StudentMathInput from '../components/StudentMathInput';
import StudentCalculator from '../components/StudentCalculator';
import LaTeXRenderer from '../components/LaTeXRenderer';
import FormulaSheet from '../components/FormulaSheet';
import GraphPlotter from '../components/GraphPlotter';
import StepByStepInput from '../components/StepByStepInput';
import { API } from '@/config';

export const AttemptPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [showWorking, setShowWorking] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);
  
  // Phase 3: New feature states
  const [showFormulaSheet, setShowFormulaSheet] = useState(false);
  const [showGraphPlotter, setShowGraphPlotter] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [useStepByStep, setUseStepByStep] = useState(false);
  const [stepByStepData, setStepByStepData] = useState(null);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  // Check if fullscreen is supported
  useEffect(() => {
    const checkFullscreenSupport = () => {
      const supported = !!(
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen ||
        document.documentElement.msRequestFullscreen
      );
      
      // Also check if we're in an iframe that blocks fullscreen
      try {
        if (window.self !== window.top) {
          // We're in an iframe - fullscreen might be blocked
          setFullscreenSupported(false);
          setShowFullscreenPrompt(false);
          return;
        }
      } catch (e) {
        // Cross-origin iframe
        setFullscreenSupported(false);
        setShowFullscreenPrompt(false);
        return;
      }
      
      setFullscreenSupported(supported);
      if (!supported) {
        setShowFullscreenPrompt(false);
      }
    };
    
    checkFullscreenSupport();
  }, []);

  // Fullscreen enforcement
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenPrompt(false);
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      // Fullscreen not available - allow access anyway but log it
      setFullscreenSupported(false);
      setShowFullscreenPrompt(false);
      axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
        event_type: 'fullscreen_not_supported'
      }).catch(err => console.error('Failed to log security event:', err));
    }
  };

  // Handle fullscreen exit with warning system
  const handleFullscreenExit = async () => {
    const newCount = fullscreenExitCount + 1;
    setFullscreenExitCount(newCount);
    
    // Log security event
    await axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
      event_type: 'fullscreen_exit',
      exit_count: newCount
    }).catch(err => console.error('Failed to log security event:', err));
    
    if (newCount >= 3) {
      // Third attempt - lock out and auto-submit
      setIsLockedOut(true);
      setWarningMessage('You have exited fullscreen 3 times. Your assessment will be automatically submitted.');
      setShowWarningModal(true);
      
      // Auto-submit after 3 seconds
      setTimeout(async () => {
        try {
          await axios.post(`${API}/public/attempt/${attemptId}/submit`, {
            answer_text: answer,
            reason: 'fullscreen_violation'
          });
          navigate('/');
        } catch (error) {
          console.error('Auto-submit failed:', error);
          navigate('/');
        }
      }, 3000);
    } else if (newCount === 2) {
      // Second attempt - final warning
      setWarningMessage(`Warning ${newCount}/3: This is your FINAL warning! Exiting fullscreen one more time will automatically submit your assessment and log you out.`);
      setShowWarningModal(true);
      setShowFullscreenPrompt(true);
    } else {
      // First attempt - warning
      setWarningMessage(`Warning ${newCount}/3: You have exited fullscreen mode. This has been logged. You have ${3 - newCount} warning(s) remaining before automatic submission.`);
      setShowWarningModal(true);
      setShowFullscreenPrompt(true);
    }
  };

  // Monitor fullscreen changes
  useEffect(() => {
    if (showFeedback || !fullscreenSupported) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      
      const wasFullscreen = isFullscreen;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (wasFullscreen && !isCurrentlyFullscreen && !showFeedback && !isLockedOut) {
        // User exited fullscreen
        handleFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [attemptId, showFeedback]);

  // Autosave every 15 seconds
  useEffect(() => {
    if (!attemptId || showFeedback || !answer) return;
    
    const autosaveInterval = setInterval(async () => {
      try {
        const response = await axios.post(`${API}/public/attempt/${attemptId}/autosave`, {
          answer_text: answer
        });
        if (response.data.success) {
          setLastSaved(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 15000);
    
    return () => clearInterval(autosaveInterval);
  }, [attemptId, answer, showFeedback]);

  // Focus loss monitoring
  useEffect(() => {
    if (showFeedback) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Log focus loss event
        axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
          event_type: 'tab_hidden'
        }).catch(err => console.error('Failed to log security event:', err));
      }
    };
    
    const handleBlur = () => {
      axios.post(`${API}/public/attempt/${attemptId}/log-security-event`, {
        event_type: 'window_blur'
      }).catch(err => console.error('Failed to log security event:', err));
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attemptId, showFeedback]);

  useEffect(() => {
    if (!assessment?.duration_minutes || !assessment?.started_at || showFeedback) return;

    const startedAt = new Date(assessment.started_at);
    const duration = assessment.duration_minutes * 60 * 1000;
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

  const loadAttempt = async () => {
    try {
      const response = await axios.get(`${API}/public/attempt/${attemptId}`);
      setAttempt(response.data.attempt);
      setAssessment(response.data.assessment);
      setQuestion(response.data.question);
      
      if (response.data.attempt.status === 'marked') {
        setShowFeedback(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading attempt:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && submitting) return;
    
    setSubmitting(true);

    try {
      // Prepare submission data with Phase 3 enhancements
      const submissionData = {
        answer_text: answer,
        show_working: showWorking
      };

      // Add graph data if available
      if (graphData) {
        submissionData.graph_data = {
          mode: graphData.mode,
          equation: graphData.equation,
          points: graphData.points,
          image: graphData.image
        };
      }

      // Add step-by-step data if available
      if (stepByStepData && stepByStepData.length > 0) {
        submissionData.step_by_step = stepByStepData;
        submissionData.is_step_by_step = true;
      }

      const response = await axios.post(`${API}/public/attempt/${attemptId}/submit`, submissionData);
      
      setAttempt(response.data.attempt);
      setShowFeedback(true);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to submit');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen" data-testid="loading-attempt">Loading...</div>;
  }

  if (!attempt || !question) {
    return <div className="flex items-center justify-center min-h-screen" data-testid="attempt-not-found">Attempt not found</div>;
  }

  if (showFeedback && attempt.status === 'marked') {
    // Check if feedback has been released by teacher
    const feedbackReleased = attempt.feedback_released || false;
    
    if (!feedbackReleased) {
      // Show thank you message - feedback not yet released
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8" data-testid="submission-confirmation">
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
                  Your answer has been submitted successfully and is being reviewed by your teacher.
                </p>
                <p className="text-gray-700 mt-4">
                  Your teacher will review your work and release feedback when ready. Please check back later or wait for your teacher to share the results with you.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Show full feedback if released
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8" data-testid="feedback-container">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="feedback-title">Feedback for {attempt.student_name}</h1>
            <p className="text-gray-600">Your answer has been marked</p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Your Score</p>
              <p className="text-4xl font-bold text-blue-600" data-testid="feedback-score">{attempt.score}/{question.max_marks}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="www-title">What Went Well</h3>
              <p className="text-gray-700" data-testid="www-content">{attempt.www}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="next-steps-title">Next Steps</h3>
              <p className="text-gray-700" data-testid="next-steps-content">{attempt.next_steps}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="overall-title">Overall Feedback</h3>
              <p className="text-gray-700" data-testid="overall-content">{attempt.overall_feedback}</p>
            </div>

            {/* Phase 3: Step-by-Step Feedback */}
            {attempt.step_feedback && attempt.step_feedback.step_feedback && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Step-by-Step Feedback</h3>
                <div className="space-y-3">
                  {attempt.step_feedback.step_feedback.map((step, idx) => (
                    <div
                      key={idx}
                      className={`border-l-4 p-4 rounded ${
                        step.isCorrect === true
                          ? 'bg-green-50 border-green-500'
                          : step.isCorrect === false
                          ? 'bg-red-50 border-red-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">
                          {step.isCorrect === true ? '✅' : step.isCorrect === false ? '❌' : '⚠️'}
                          Step {step.stepNumber}:
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{step.feedback}</p>
                          {step.marks !== undefined && (
                            <p className="text-xs text-gray-600 mt-1">
                              Marks: {step.marks}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attempt.pdf_url && (
              <div className="pt-4">
                <a
                  href={`${API}/public/attempt/${attemptId}/download-pdf`}
                  download
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  data-testid="download-pdf-btn"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Feedback PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Warning modal for fullscreen violations
  if (showWarningModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" data-testid="warning-modal">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
          <div className={`w-16 h-16 ${isLockedOut ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-8 h-8 ${isLockedOut ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${isLockedOut ? 'text-red-600' : 'text-yellow-600'} mb-2`}>
            {isLockedOut ? 'Assessment Terminated' : 'Security Warning'}
          </h2>
          <p className="text-gray-700 mb-6">{warningMessage}</p>
          {!isLockedOut && (
            <button
              onClick={() => {
                setShowWarningModal(false);
                enterFullscreen();
              }}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              data-testid="acknowledge-warning-btn"
            >
              I Understand - Return to Fullscreen
            </button>
          )}
          {isLockedOut && (
            <p className="text-sm text-gray-500">Redirecting in 3 seconds...</p>
          )}
        </div>
      </div>
    );
  }

  // Fullscreen prompt overlay
  if (showFullscreenPrompt && !showFeedback && fullscreenSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" data-testid="fullscreen-prompt">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fullscreen Required</h2>
          <p className="text-gray-600 mb-6">
            This assessment must be taken in fullscreen mode to ensure exam integrity. 
            Please click the button below to enter fullscreen.
          </p>
          {fullscreenExitCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>Warnings: {fullscreenExitCount}/3</strong> - {3 - fullscreenExitCount} attempt(s) remaining before automatic submission.
              </p>
            </div>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Exiting fullscreen 3 times will automatically submit your assessment and log you out.
            </p>
          </div>
          <button
            onClick={enterFullscreen}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            data-testid="enter-fullscreen-btn"
          >
            Enter Fullscreen Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        // Block Ctrl/Cmd + C, V, X, P, and Escape
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p'].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
        // Prevent Escape from exiting fullscreen (though browser may override)
        if (e.key === 'Escape') {
          e.preventDefault();
        }
      }}
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8" data-testid="attempt-container">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" data-testid="attempt-title">{question.subject}</h1>
            <p className="text-gray-600 text-sm">Marks: {question.max_marks}</p>
          </div>
          {timeLeft !== null && (
            <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`} data-testid="timer">
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-medium text-gray-900 mb-2">Question:</p>
          <div 
            className="text-gray-700 select-none"
            data-testid="question-text"
          >
            <LaTeXRenderer text={question.question_text} />
          </div>
        </div>

        {/* Phase 3: Advanced Math Tools */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setShowFormulaSheet(true)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm flex items-center gap-2"
          >
            📚 Formula Sheet
          </button>
          
          {(question.answer_type === 'maths' || question.answer_type === 'mixed') && (
            <>
              <button
                onClick={() => setShowGraphPlotter(!showGraphPlotter)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm flex items-center gap-2"
              >
                📊 {showGraphPlotter ? 'Hide' : 'Show'} Graph Plotter
              </button>
              
              <button
                onClick={() => setUseStepByStep(!useStepByStep)}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 ${
                  useStepByStep
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                📋 {useStepByStep ? '✓ Using' : 'Use'} Step-by-Step Mode
              </button>
            </>
          )}
        </div>

        {/* Graph Plotter (if shown) */}
        {showGraphPlotter && (
          <div className="mb-6">
            <GraphPlotter
              onSave={(data) => {
                setGraphData(data);
                setShowGraphPlotter(false);
                alert('Graph saved! It will be submitted with your answer.');
              }}
              initialData={graphData}
            />
          </div>
        )}

        {/* Answer Input Area */}
        <div className="mb-6">
          {useStepByStep ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Step-by-Step Solution
                </label>
                {lastSaved && (
                  <span className="text-xs text-green-600">
                    ✓ Auto-saved at {lastSaved}
                  </span>
                )}
              </div>
              <StepByStepInput
                onSubmit={(steps) => {
                  setStepByStepData(steps);
                  // Auto-populate answer field with summary
                  const summary = steps.map((s, i) => 
                    `Step ${s.stepNumber}: ${s.description}\n${s.calculation}`
                  ).join('\n\n');
                  setAnswer(summary);
                }}
                maxSteps={10}
              />
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700" data-testid="answer-label">
                  Your Answer
                </label>
                {lastSaved && (
                  <span className="text-xs text-green-600" data-testid="autosave-status">
                    ✓ Auto-saved at {lastSaved}
                  </span>
                )}
              </div>
              <StudentMathInput
                questionId={question.id}
                answerType={question.answer_type || 'text'}
                value={answer}
                onChange={setAnswer}
                calculatorAllowed={question.calculator_allowed || false}
                scientificCalculatorAllowed={question.calculator_allowed || false}
                placeholder="Type your answer here..."
                showWorkingValue={showWorking}
                onShowWorkingChange={setShowWorking}
                enableScratchpad={true}
              />
            </>
          )}
        </div>

        {/* Submit Button */}
        <button
          data-testid="submit-answer-btn"
          onClick={() => handleSubmit(false)}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={submitting || !answer.trim()}
        >
          {submitting ? 'Submitting...' : useStepByStep ? 'Submit Step-by-Step Solution' : 'Submit Answer'}
        </button>
        
        {/* Formula Sheet Modal */}
        {showFormulaSheet && (
          <FormulaSheet
            isOpen={showFormulaSheet}
            onClose={() => setShowFormulaSheet(false)}
          />
        )}
      </div>
    </div>
  );
};

// Teacher Dashboard
