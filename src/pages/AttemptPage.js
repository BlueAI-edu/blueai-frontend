import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StudentMathInput from '../components/StudentMathInput';
import LaTeXRenderer from '../components/LaTeXRenderer';
import FormulaSheet from '../components/FormulaSheet';
import GraphPlotter from '../components/GraphPlotter';
import StepByStepInput from '../components/StepByStepInput';
import SecurityOverlays from '../components/SecurityOverlays';
import AttemptFeedbackView from '../components/AttemptFeedbackView';
import Phase3ToolBar from '../components/Phase3ToolBar';
import { useTimer } from '../hooks/use-timer';
import { useAutosave } from '../hooks/use-autosave';
import { useFullscreenSecurity } from '../hooks/use-fullscreen-security';
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
  const [showFeedback, setShowFeedback] = useState(false);

  // Phase 3 states
  const [showFormulaSheet, setShowFormulaSheet] = useState(false);
  const [showGraphPlotter, setShowGraphPlotter] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [useStepByStep, setUseStepByStep] = useState(false);
  const [stepByStepData, setStepByStepData] = useState(null);

  const { timeLeft, formatTime } = useTimer({
    startedAt: assessment?.started_at,
    durationMinutes: assessment?.duration_minutes,
    enabled: !showFeedback,
    onExpire: () => handleSubmit(true),
  });

  const { lastSaved } = useAutosave({
    attemptId,
    data: { answer_text: answer },
    endpoint: `/public/attempt/${attemptId}/autosave`,
    enabled: !!attemptId && !showFeedback && !!answer,
    mode: 'interval',
    delay: 15000,
  });

  const security = useFullscreenSecurity({
    attemptId,
    enabled: !showFeedback,
    onLockout: async () => {
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
    },
  });

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

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
      const submissionData = { answer_text: answer, show_working: showWorking };
      if (graphData) {
        submissionData.graph_data = {
          mode: graphData.mode,
          equation: graphData.equation,
          points: graphData.points,
          image: graphData.image
        };
      }
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen" data-testid="loading-attempt">Loading...</div>;
  }

  if (!attempt || !question) {
    return <div className="flex items-center justify-center min-h-screen" data-testid="attempt-not-found">Attempt not found</div>;
  }

  if (showFeedback && attempt.status === 'marked') {
    return <AttemptFeedbackView attempt={attempt} question={question} attemptId={attemptId} />;
  }

  // Security overlays (fullscreen prompt + warning modal)
  const overlay = (
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
    return overlay;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p'].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
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
          <div className="text-gray-700 select-none" data-testid="question-text">
            <LaTeXRenderer text={question.question_text} />
          </div>
        </div>

        <Phase3ToolBar
          question={question}
          showGraphPlotter={showGraphPlotter}
          onToggleGraphPlotter={() => setShowGraphPlotter(!showGraphPlotter)}
          useStepByStep={useStepByStep}
          onToggleStepByStep={() => setUseStepByStep(!useStepByStep)}
          onShowFormulaSheet={() => setShowFormulaSheet(true)}
        />

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
                  <span className="text-xs text-green-600">Auto-saved at {lastSaved}</span>
                )}
              </div>
              <StepByStepInput
                onSubmit={(steps) => {
                  setStepByStepData(steps);
                  const summary = steps.map((s) =>
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
                    Auto-saved at {lastSaved}
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

        <button
          data-testid="submit-answer-btn"
          onClick={() => handleSubmit(false)}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={submitting || !answer.trim()}
        >
          {submitting ? 'Submitting...' : useStepByStep ? 'Submit Step-by-Step Solution' : 'Submit Answer'}
        </button>

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
