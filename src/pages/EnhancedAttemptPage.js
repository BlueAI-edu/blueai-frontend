import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LaTeXRenderer from '../components/LaTeXRenderer';
import DiagramRenderer from '../components/DiagramRenderer';
import DrawableCanvas, { requiresDrawing } from '../components/DrawableCanvas';
import MathsliveAnswerInput from '../components/MathsliveAnswerInput';
import MathsliveKeyboardPanel from '../components/MathsliveKeyboardPanel';
import GraphPlotInput from '../components/GraphPlotInput';
import DiagramLabelInput from '../components/DiagramLabelInput';
import StudentCalculator from '../components/StudentCalculator';
import EnhancedFeedbackView from '../components/EnhancedFeedbackView';
import QuestionSidebar from '../components/QuestionSidebar';
import SecurityOverlays from '../components/SecurityOverlays';
import { useTimer } from '../hooks/use-timer';
import { useFullscreenSecurity } from '../hooks/use-fullscreen-security';
import { API } from '@/config';
import { handleApiError } from '@/lib/handle-error';
import { hasAnswer } from '@/lib/utils';


export const EnhancedAttemptPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitStage, setSubmitStage] = useState('');
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const mathfieldRef = useRef(null);
  const answersRef = useRef(answers); // 🚀 NEW: Reference to hold latest answers

  // 🚀 NEW: Keep the ref updated every time answers change
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // NEW: Robust Autosave States
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Detect mobile layout on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth < 768);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { timeLeft } = useTimer({
    startedAt: attempt?.started_at ?? attempt?.joined_at,
    durationMinutes: assessment?.durationMinutes ?? assessment?.duration_minutes,
    enabled: !showFeedback && !submitted,
    onExpire: () => handleSubmit(true),
  });

  const security = useFullscreenSecurity({
    attemptId,
    enabled: !showFeedback && !submitted,
    onLockout: async () => {
      try {
        await axios.post(`${API}/public/enhanced-attempt/${attemptId}/submit`, {
          answers: answersRef.current, // 🚀 FIX: Use the ref here!
          autoSubmitted: true,
          reason: 'fullscreen_violation',
        });
      } catch {
        // best-effort
      }
      navigate('/');
    },
  });

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  // NEW: Bulletproof Inline Autosave Logic
  useEffect(() => {
    if (!hasUnsavedChanges || showFeedback || submitted) return;

    // Reduced debounce to 1.5s for faster safety
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await axios.post(`${API}/public/enhanced-attempt/${attemptId}/autosave`, {
          answers
        });
        setHasUnsavedChanges(false); // Mark as safely saved
      } catch (error) {
        console.error("Autosave failed", error);
      } finally {
        setIsSaving(false);
      }
    }, 1500); 

    return () => clearTimeout(timer);
  }, [answers, hasUnsavedChanges, attemptId, showFeedback, submitted]);

  // NEW: Native Browser Tab-Close Prevention
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = 'You have unsaved answers. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);


  // Exit fullscreen automatically when the student has submitted so the
  // results page is not trapped behind a forced-fullscreen session.
  useEffect(() => {
    const fullscreenEl =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
    if ((showFeedback || submitted) && fullscreenEl) {
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
      exit?.call(document)?.catch(() => {});
    }
  }, [showFeedback, submitted]);

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

  const handleAnswerChange = useCallback((questionNumber, value) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
    setHasUnsavedChanges(true); // NEW: Flag that we need to save!
  }, []);

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
    setSubmitProgress(0);
    setSubmitStage('Preparing your answers...');
    setShowSubmitConfirm(false);

    // Simulate progress stages while request is in flight
    const stages = [
      { pct: 15, label: 'Preparing your answers...' },
      { pct: 35, label: 'Saving your responses...' },
      { pct: 60, label: 'Uploading to server...' },
      { pct: 80, label: 'Almost there, please wait...' },
      { pct: 90, label: 'Finalising submission...' },
    ];

    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < stages.length) {
        setSubmitProgress(stages[stageIndex].pct);
        setSubmitStage(stages[stageIndex].label);
        stageIndex++;
      }
    }, 600);

    try {
      await axios.post(`${API}/public/enhanced-attempt/${attemptId}/submit`, {
        answers,
        autoSubmitted: autoSubmit,
      });
      clearInterval(interval);
      setSubmitProgress(100);
      setSubmitStage('Submitted successfully!');
      setHasUnsavedChanges(false); // NEW: Clear unsaved flag on submit
      setTimeout(() => setSubmitted(true), 600);
    } catch (error) {
      clearInterval(interval);
      handleApiError(error, 'Failed to submit assessment');
      setSubmitting(false);
      setSubmitProgress(0);
      setSubmitStage('');
    }
  };

  const toggleFlag = useCallback((index) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const goToQuestion = useCallback((index) => setCurrentQuestionIndex(index), []);
  const goToNextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev < (assessment?.questions?.length || 1) - 1 ? prev + 1 : prev);
  }, [assessment?.questions?.length]);
  const goToPreviousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  const answerProgress = useMemo(() => {
    if (!assessment?.questions) return { answeredCount: 0, totalItems: 0 };
    let answeredCount = 0;
    let totalItems = 0;
    assessment.questions.forEach(q => {
      if (q.questionType === 'STRUCTURED_WITH_PARTS' && q.parts && q.parts.length > 0) {
        totalItems += q.parts.length;
        q.parts.forEach(part => {
          const partKey = `${q.questionNumber}-${part.partLabel}`;
          if (hasAnswer(answers[partKey])) answeredCount++;
        });
      } else {
        totalItems += 1;
        if (hasAnswer(answers[q.questionNumber])) answeredCount++;
      }
    });
    return { answeredCount, totalItems };
  }, [assessment?.questions, answers, hasAnswer]);

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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Submitted</h1>
          <p className="text-gray-500 mb-6">
            Your answers have been saved successfully.
            {assessment?.title && (
              <span className="block mt-1 font-medium text-gray-700">{assessment.title}</span>
            )}
          </p>
          <div className="bg-blue-50 rounded-lg px-5 py-4 text-sm text-blue-700 mb-8">
            Your teacher will review your results and release feedback when ready.
            You can safely close this window.
          </div>
          <p className="text-xs text-gray-400">You may now close this tab.</p>
        </div>
      </div>
    );
  }

  if (showFeedback) {
    return <EnhancedFeedbackView attempt={attempt} assessment={assessment} />;
  }

  const securityOverlay = (
    <SecurityOverlays
      showWarningModal={security.showWarningModal}
      showFullscreenPrompt={security.showFullscreenPrompt}
      showFeedback={showFeedback}
      fullscreenSupported={security.fullscreenSupported}
      fullscreenExitCount={security.fullscreenExitCount}
      isLockedOut={security.isLockedOut}
      warningMessage={security.warningMessage}
      onEnterFullscreen={security.enterFullscreen}
      onDismissWarning={security.dismissWarning}
    />
  );

  if (security.showWarningModal || (security.showFullscreenPrompt && !showFeedback && security.fullscreenSupported)) {
    return securityOverlay;
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

  const shouldDraw = (entity, text) => {
    if (entity?.drawingEnabled === true) return true;
    if (entity?.drawingEnabled === false) return false;
    return requiresDrawing(text);
  };

  return (
    <div
      className="h-screen overflow-hidden bg-gray-50 flex"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p'].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }}
    >
      <QuestionSidebar
        assessment={assessment}
        timeLeft={timeLeft}
        answers={answers}
        currentQuestionIndex={currentQuestionIndex}
        flaggedQuestions={flaggedQuestions}
        onGoToQuestion={goToQuestion}
        onToggleFlag={toggleFlag}
        onSubmit={() => handleSubmit(false)}
        submitting={submitting}
        isSaving={isSaving}
        answerProgress={answerProgress}
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Question {currentQuestion.questionNumber}
              </h2>
              <div className="flex items-center gap-3">
                {currentQuestion.maxMarks && !isFormative && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {currentQuestion.maxMarks} marks
                  </span>
                )}
                <button
                  onClick={() => toggleFlag(currentQuestionIndex)}
                  title={flaggedQuestions.has(currentQuestionIndex) ? 'Remove flag' : 'Flag for review'}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    flaggedQuestions.has(currentQuestionIndex)
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill={flaggedQuestions.has(currentQuestionIndex) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  {flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}
                </button>
              </div>
            </div>

            <div className="prose max-w-none">
              <LaTeXRenderer text={currentQuestion.questionBody || ''} />
            </div>

            {currentQuestion.stimulusBlock && (
              <DiagramRenderer diagram={currentQuestion.stimulusBlock} className="mt-2" />
            )}

            {currentQuestion.questionType === 'STRUCTURED_WITH_PARTS' && (() => {
              const qNeedsDrawing = shouldDraw(currentQuestion, currentQuestion.questionBody);
              if (!qNeedsDrawing) return null;
              const sketchKey = `${currentQuestion.questionNumber}-drawing`;
              let savedSketch = null;
              if (answers[sketchKey]) {
                try {
                  const p = JSON.parse(answers[sketchKey]);
                  if (p?._type === 'drawing') savedSketch = p.imageData;
                } catch { }
              }
              return (
                <div className="mt-4 border border-purple-200 bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-800 mb-3">
                    Use the grid below to sketch your answer
                  </p>
                  <DrawableCanvas
                    key={sketchKey}
                    initialDrawing={savedSketch}
                    backgroundImage={currentQuestion.stimulusBlock?.type === 'image' ? currentQuestion.stimulusBlock.content : undefined}
                    onChange={(imageData) =>
                      handleAnswerChange(sketchKey, JSON.stringify({ _type: 'drawing', imageData }))
                    }
                  />
                </div>
              );
            })()}

            {currentQuestion.questionType === 'STRUCTURED_WITH_PARTS' && currentQuestion.parts && currentQuestion.parts.length > 0 && (
              <div className="mt-6 space-y-6">
                {currentQuestion.parts.map((part, idx) => {
                  const partAnswerKey = `${currentQuestion.questionNumber}-${part.partLabel}`;
                  const partNeedsDrawing = shouldDraw(part, part.partPrompt);
                  let savedDrawingData = null;
                  if (partNeedsDrawing && answers[partAnswerKey]) {
                    try {
                      const p = JSON.parse(answers[partAnswerKey]);
                      if (p?._type === 'drawing') savedDrawingData = p.imageData;
                    } catch { }
                  }
                  return (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-blue-600">({part.partLabel})</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {part.maxMarks} {part.maxMarks === 1 ? 'mark' : 'marks'}
                            </span>
                            {partNeedsDrawing && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                Draw / Plot
                              </span>
                            )}
                          </div>
                          <div className="prose max-w-none">
                            <LaTeXRenderer text={part.partPrompt || ''} />
                          </div>
                          {part.partStimulus && (
                            <DiagramRenderer diagram={part.partStimulus} className="mt-2" />
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        {partNeedsDrawing ? (
                          <DrawableCanvas
                            key={partAnswerKey}
                            initialDrawing={savedDrawingData}
                            backgroundImage={
                              (part.partStimulus?.type === 'image' && part.partStimulus.content)
                              || (currentQuestion.stimulusBlock?.type === 'image' ? currentQuestion.stimulusBlock.content : undefined)
                            }
                            onChange={(imageData) =>
                              handleAnswerChange(partAnswerKey, JSON.stringify({ _type: 'drawing', imageData }))
                            }
                          />
                        ) : (
                            <MathsliveAnswerInput
                              value={answers[partAnswerKey] || ''}
                              onChange={(value) => handleAnswerChange(partAnswerKey, value)}
                              questionType={part.questionType || 'ALGEBRA'}
                              placeholder={`Your answer for part ${part.partLabel}...`}
                              inputRef={mathfieldRef}
                              className="w-full"
                            />
                            )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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

          {currentQuestion.questionType !== 'MULTIPLE_CHOICE' &&
           currentQuestion.questionType !== 'STRUCTURED_WITH_PARTS' && (() => {
            const needsDrawing = shouldDraw(currentQuestion, currentQuestion.questionBody);
            let savedDrawing = null;
            if (needsDrawing && answers[currentQuestion.questionNumber]) {
              try {
                const p = JSON.parse(answers[currentQuestion.questionNumber]);
                if (p?._type === 'drawing') savedDrawing = p.imageData;
              } catch { }
            }
            const graphSpec = currentQuestion.graphSpec;
            let savedGraph = null;
            if (graphSpec && answers[currentQuestion.questionNumber]) {
              try {
                const p = JSON.parse(answers[currentQuestion.questionNumber]);
                if (p?._type === 'graph_plot') savedGraph = p;
              } catch { /* not a graph answer */ }
            }
            const labelImage = currentQuestion.diagramLabels && currentQuestion.stimulusBlock?.type === 'image'
              ? currentQuestion.stimulusBlock.content
              : null;
            let savedLabels = null;
            if (labelImage && answers[currentQuestion.questionNumber]) {
              try {
                const p = JSON.parse(answers[currentQuestion.questionNumber]);
                if (p?._type === 'diagram_labels') savedLabels = p;
              } catch { /* not a labels answer */ }
            }
            return (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  Your Answer
                  {needsDrawing && !graphSpec && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      Draw / Plot
                    </span>
                  )}
                </h3>
                {graphSpec ? (
                  <GraphPlotInput
                    key={currentQuestion.questionNumber}
                    spec={graphSpec}
                    value={savedGraph}
                    onChange={(answer) =>
                      handleAnswerChange(currentQuestion.questionNumber, JSON.stringify(answer))
                    }
                  />
                ) : labelImage ? (
                  <DiagramLabelInput
                    key={currentQuestion.questionNumber}
                    image={labelImage}
                    value={savedLabels}
                    onChange={(answer) =>
                      handleAnswerChange(currentQuestion.questionNumber, JSON.stringify(answer))
                    }
                  />
                ) : needsDrawing ? (
                  <DrawableCanvas
                    key={currentQuestion.questionNumber}
                    initialDrawing={savedDrawing}
                    backgroundImage={currentQuestion.stimulusBlock?.type === 'image' ? currentQuestion.stimulusBlock.content : undefined}
                    onChange={(imageData) =>
                      handleAnswerChange(currentQuestion.questionNumber, JSON.stringify({ _type: 'drawing', imageData }))
                    }
                  />
                ) : (
                  <MathsliveAnswerInput
                    value={answers[currentQuestion.questionNumber] || ''}
                    onChange={(value) => handleAnswerChange(currentQuestion.questionNumber, value)}
                    questionType={currentQuestion.questionType}
                    placeholder="Type your answer here..."
                    className="w-full"
                  />
                )}
              </div>
            );
          })()}

          {assessment.mathKeyboardEnabled && showMathKeyboard && (
            <MathsliveKeyboardPanel
              shown={showMathKeyboard}
              onClose={() => setShowMathKeyboard(false)}
              questionType={currentQuestion.questionType}
              mathfieldRef={mathfieldRef}
              mobileLayout={isMobileLayout}
            />
          )}

          {assessment.calculatorAllowed && showCalculator && (
            <StudentCalculator
              onClose={() => setShowCalculator(false)}
              defaultPosition={{ x: 16, y: null }} 
              />
          )}

          {(assessment.calculatorAllowed || assessment.mathKeyboardEnabled) && (
            <div className="fixed right-4 bottom-8 flex flex-col gap-2 z-50">
              {assessment.calculatorAllowed && (
                <button
                  onClick={() => setShowCalculator(v => !v)}
                  title={showCalculator ? 'Hide calculator' : 'Open scientific calculator'}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium transition-colors ${
                    showCalculator
                      ? 'bg-purple-800 text-white ring-2 ring-purple-400'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" />
                  </svg>
                  Calculator
                  {showCalculator && <span className="text-xs opacity-70">(drag to move)</span>}
                </button>
              )}

              {assessment.mathKeyboardEnabled && (
                <button
                  onClick={() => setShowMathKeyboard(v => !v)}
                  title={showMathKeyboard ? 'Hide keyboard' : 'Open maths & science keyboard'}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium transition-colors ${
                    showMathKeyboard
                      ? 'bg-blue-800 text-white ring-2 ring-blue-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Maths Keyboard
                  {showMathKeyboard && <span className="text-xs opacity-70">(drag to move)</span>}
                </button>
              )}
            </div>
          )}

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
      {submitting && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div
                className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Submitting your assessment</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Please <span className="font-semibold text-gray-700">do not close this tab</span> until submission is complete.
            </p>

            <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                style={{ width: `${submitProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
              <span>{submitStage}</span>
              <span>{submitProgress}%</span>
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              ⚠️ Closing this page now may cause your answers to be lost.
            </p>
          </div>
        </div>
      )}
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