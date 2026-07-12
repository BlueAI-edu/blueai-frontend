import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import LaTeXRenderer from '../components/LaTeXRenderer';
import { Navbar } from '../components/Navbar';
import { API } from '@/config';
import { handleApiError, showSuccess } from '@/lib/handle-error';
import { useAsync } from '@/hooks/use-async';

export const EnhancedSubmissionDetailPage = ({ user }) => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [runSave, saving] = useAsync();
  const [runDownload, downloading] = useAsync();
  const [runRegenerate, regenerating] = useAsync();
  const [data, setData] = useState(null);
  
  // Feedback state
  const [questionScores, setQuestionScores] = useState({});
  const [www, setWww] = useState('');
  const [ebi, setEbi] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  // Manual diagram/graph marking progress: keys the teacher has entered a mark
  // for this session (drives the red→green outlines and the jump panel)
  const [touchedManual, setTouchedManual] = useState(() => new Set());

  useEffect(() => {
    loadData();
  }, [attemptId]);

  const loadData = async () => {
    try {
      const response = await axios.get(`${API}/teacher/submissions/${attemptId}/enhanced`);
      setData(response.data);
      
      // Initialize feedback if already marked
      if (response.data.attempt.status === 'marked') {
        setWww(response.data.attempt.www || '');
        setEbi(response.data.attempt.next_steps || '');
        setOverallFeedback(response.data.attempt.overall_feedback || '');
        
        // Initialize question scores if available
        if (response.data.attempt.questionScores) {
          setQuestionScores(response.data.attempt.questionScores);
        }
      }
      
      setLoading(false);
    } catch (error) {
      handleApiError(error, 'Failed to load submission');
      setLoading(false);
    }
  };

  const handleScoreChange = (questionNumber, score) => {
    setQuestionScores(prev => ({
      ...prev,
      [questionNumber]: parseInt(score) || 0
    }));
    // Entering a mark for a manual diagram/graph item turns its outline green
    setTouchedManual(prev => {
      const key = String(questionNumber);
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const scrollToQuestion = (key) => {
    // Part keys like "12-i" live inside the parent question card
    const qn = String(key).split('-')[0];
    document.getElementById(`question-card-${qn}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const calculateTotalScore = () => {
    return Object.values(questionScores).reduce((sum, score) => sum + (score || 0), 0);
  };

  const handleSave = () => runSave(
    async () => {
      const totalScore = calculateTotalScore();

      await axios.post(`${API}/teacher/submissions/${attemptId}/mark-enhanced`, {
        questionScores,
        totalScore,
        www,
        next_steps: ebi,
        overall_feedback: overallFeedback
      });

      showSuccess('Feedback saved successfully!');
      loadData();
    },
    (error) => handleApiError(error, 'Failed to save feedback')
  );

  const handleDownloadPDF = () => runDownload(
    async () => {
      const response = await axios.get(`${API}/teacher/submissions/${attemptId}/download-pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const studentName = data?.attempt?.student_name || 'Student';
      const subject = data?.assessment?.subject || 'Assessment';
      link.download = `${studentName}_${subject}_Feedback.pdf`.replace(/\s+/g, '_');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    (error) => handleApiError(error, 'PDF generation failed. Please retry.')
  );

  const handleRegeneratePDF = () => runRegenerate(
    async () => {
      await axios.post(`${API}/teacher/submissions/${attemptId}/regenerate-pdf`);
      showSuccess('PDF regenerated successfully!');
      loadData();
    },
    (error) => handleApiError(error, 'Failed to regenerate PDF')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-800">Submission not found</p>
      </div>
    );
  }

  const { attempt, assessment } = data;
  const isFormative = assessment.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE';
  const answers = attempt.answers || {};
  // Numeric ordering (2 < 3-a < 11) — server sorts too; this covers attempts
  // marked before the ordering fix
  const keyOrder = (k) => {
    const m = String(k).match(/^(\d+)(?:-(.+))?$/);
    return m ? [parseInt(m[1], 10), m[2] || ''] : [Number.MAX_SAFE_INTEGER, String(k)];
  };
  const manualQuestions = [...(attempt.manual_marking_questions || [])].sort((a, b) => {
    const [na, sa] = keyOrder(a);
    const [nb, sb] = keyOrder(b);
    return na !== nb ? na - nb : String(sa).localeCompare(String(sb));
  });
  // Strict mode blocks release until marked; review mode means the AI has
  // drafted marks and the teacher double-checks
  const isBlockingMode = Boolean(attempt.manual_marking_required);

  // Per-question manual-marking state for outlines and the jump panel
  const manualKeysFor = (qn) =>
    manualQuestions.filter((k) => String(k) === String(qn) || String(k).startsWith(`${qn}-`));
  const pendingCount = manualQuestions.filter((k) => !touchedManual.has(String(k))).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Manual diagram/graph marking gate — feedback release is blocked
            server-side until the teacher enters marks and saves. */}
        {manualQuestions.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6" data-testid="manual-marking-banner">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">✏️</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-amber-900">
                  {isBlockingMode
                    ? 'Manual marking required before feedback can be released'
                    : 'Diagram/graph answers — double-check the AI marks'}
                </h3>
                <p className="text-sm text-amber-800 mt-1">
                  {isBlockingMode
                    ? 'The questions below contain a diagram or graph and have not been auto-marked. Click one to jump to it, enter its marks, and save — feedback release stays blocked until you do.'
                    : 'The AI has marked the diagram/graph answers below. Click one to jump to it, check the mark against the student’s answer, adjust if needed, and save before releasing feedback.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {manualQuestions.map((k) => (
                    <button
                      key={k}
                      onClick={() => scrollToQuestion(k)}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                        touchedManual.has(String(k))
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {touchedManual.has(String(k)) ? '✓' : '✏️'} Q{k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating jump panel — stays in view while scrolling so the teacher
            can hop between the diagram/graph questions that still need marks */}
        {manualQuestions.length > 0 && (
          <div className="hidden md:block fixed right-4 top-28 z-40 w-44 bg-white border-2 border-amber-300 rounded-xl shadow-lg" data-testid="manual-marking-jump-panel">
            <div className="px-3 py-2 border-b border-amber-100 bg-amber-50 rounded-t-[10px]">
              <p className="text-xs font-semibold text-amber-900">
                {isBlockingMode ? 'Manual marking' : 'Double-check marks'}
              </p>
              <p className="text-[11px] text-amber-700">
                {pendingCount === 0
                  ? (isBlockingMode ? 'All entered — now Save ↓' : 'All checked — now Save ↓')
                  : `${pendingCount} of ${manualQuestions.length} remaining`}
              </p>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto flex flex-wrap gap-1.5">
              {manualQuestions.map((k) => (
                <button
                  key={k}
                  onClick={() => scrollToQuestion(k)}
                  title={`Jump to question ${k}`}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    touchedManual.has(String(k))
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {touchedManual.has(String(k)) ? '✓' : ''} Q{k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{attempt.student_name}'s Submission</h2>
              <p className="text-gray-600">{assessment.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {assessment.assessmentMode?.replace(/_/g, ' ')}
                </span>
                {isFormative && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Formative Feedback
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">
                {isFormative ? 'Marks Awarded' : 'Total Score'}
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {calculateTotalScore()} / {assessment.totalMarks}
              </p>
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6 mb-6">
          {assessment.questions?.map((question, index) => {
            const isStructured = question.questionType === 'STRUCTURED_WITH_PARTS' && question.parts && question.parts.length > 0;
            // Red outline until every manual diagram/graph item in this
            // question has a mark entered, then green
            const qManualKeys = manualKeysFor(question.questionNumber);
            const needsManual = qManualKeys.length > 0;
            const manualDone = needsManual && qManualKeys.every((k) => touchedManual.has(String(k)));
            const outline = needsManual
              ? manualDone
                ? 'border-2 border-green-500'
                : 'border-2 border-red-500'
              : '';

            return (
              <div
                key={question.questionNumber}
                id={`question-card-${question.questionNumber}`}
                className={`bg-white p-6 rounded-lg shadow scroll-mt-24 ${outline}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {question.questionNumber}
                  </h3>
                  <div className="flex items-center gap-2">
                    {needsManual && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        manualDone ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                      }`}>
                        {manualDone
                          ? '✓ Checked — remember to save'
                          : isBlockingMode ? '✏️ Mark manually' : '✏️ Double-check AI mark'}
                      </span>
                    )}
                    {question.maxMarks && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {question.maxMarks} marks
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Question:</p>
                  <div className="prose max-w-none">
                    <LaTeXRenderer text={question.questionBody || ''} />
                  </div>
                </div>

                {/* Structured Question Parts */}
                {isStructured ? (
                  <div className="space-y-4">
                    {question.parts.map((part, partIdx) => {
                      const partKey = `${question.questionNumber}-${part.partLabel}`;
                      const partAnswer = answers[partKey];
                      
                      return (
                        <div key={partIdx} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-blue-600 text-lg">({part.partLabel})</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {part.maxMarks} {part.maxMarks === 1 ? 'mark' : 'marks'}
                            </span>
                          </div>

                          {/* Part Prompt */}
                          <div className="mb-3 p-3 bg-gray-50 rounded">
                            <div className="prose max-w-none text-sm">
                              <LaTeXRenderer text={part.partPrompt || ''} />
                            </div>
                          </div>

                          {/* Student Answer for this part */}
                          <div className="mb-3 p-3 bg-blue-50 rounded">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Student's Answer:</p>
                            <div className="prose max-w-none">
                              {partAnswer ? (
                                <LaTeXRenderer text={String(partAnswer)} />
                              ) : (
                                <p className="text-gray-500 italic text-sm">No answer provided</p>
                              )}
                            </div>
                          </div>

                          {/* Mark Scheme for part — includes the enriched fields
                              captured during mark-scheme PDF extraction */}
                          {(part.markScheme || part.methodMarks?.length > 0 || part.levelDescriptors?.length > 0 || part.examinerNotes) ? (
                            <div className="mb-3 p-3 bg-green-50 rounded space-y-2">
                              {part.markScheme && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1 font-medium">Mark Scheme:</p>
                                  <div className="prose max-w-none text-sm">
                                    <LaTeXRenderer text={part.markScheme || ''} />
                                  </div>
                                </div>
                              )}
                              {part.methodMarks?.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1 font-medium">Method Marks:</p>
                                  <ul className="list-disc pl-4 text-sm space-y-0.5">
                                    {part.methodMarks.map((m, i) => (
                                      <li key={i}><LaTeXRenderer text={String(m)} inline /></li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {part.levelDescriptors?.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1 font-medium">Level Descriptors:</p>
                                  <ul className="list-disc pl-4 text-sm space-y-0.5">
                                    {part.levelDescriptors.map((d, i) => (
                                      <li key={i}><LaTeXRenderer text={String(d)} inline /></li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {part.examinerNotes && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1 font-medium">Examiner Notes:</p>
                                  <p className="text-sm text-gray-700 italic">{part.examinerNotes}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mb-3 p-3 bg-gray-50 border border-dashed border-gray-300 rounded">
                              <p className="text-xs text-gray-500 italic">
                                No mark scheme available for this part — mark using your own judgement.
                              </p>
                            </div>
                          )}

                          {/* Score Input for part */}
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Marks for part {part.partLabel}:
                            </label>
                            <div className="flex items-center gap-2">
                              <select
                                value={questionScores[partKey] || 0}
                                onChange={(e) => handleScoreChange(partKey, e.target.value)}
                                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                {Array.from({ length: part.maxMarks + 1 }, (_, i) => (
                                  <option key={i} value={i}>{i}</option>
                                ))}
                              </select>
                              <span className="text-sm text-gray-600">out of {part.maxMarks}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {/* Non-structured question - show as before */}
                    {/* Student Answer */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2 font-medium">Student's Answer:</p>
                      <div className="prose max-w-none">
                        {answers[question.questionNumber] ? (
                          <LaTeXRenderer text={String(answers[question.questionNumber])} />
                        ) : (
                          <p className="text-gray-500 italic">No answer provided</p>
                        )}
                      </div>
                    </div>

                    {/* Mark Scheme (if available) */}
                    {question.markScheme ? (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Mark Scheme:</p>
                        <div className="prose max-w-none text-sm">
                          <LaTeXRenderer text={question.markScheme || ''} />
                        </div>
                      </div>
                    ) : !question.modelAnswer && (
                      <div className="mb-4 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-sm text-gray-500 italic">
                          No mark scheme available for this question — mark using your own judgement.
                        </p>
                      </div>
                    )}

                    {/* Model Answer (if available) */}
                    {question.modelAnswer && (
                      <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Model Answer:</p>
                        <div className="prose max-w-none text-sm">
                          <LaTeXRenderer text={question.modelAnswer || ''} />
                        </div>
                      </div>
                    )}

                    {/* Score Input */}
                    {question.maxMarks && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marks Awarded:
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={questionScores[question.questionNumber] || 0}
                            onChange={(e) => handleScoreChange(question.questionNumber, e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {Array.from({ length: question.maxMarks + 1 }, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                          <span className="text-gray-600">out of {question.maxMarks}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Feedback Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Overall Feedback</h3>

          {/* WWW */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-green-700 mb-2">
              ✅ What Went Well (WWW)
            </label>
            <textarea
              value={www}
              onChange={(e) => setWww(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="What did the student do well?"
            />
          </div>

          {/* EBI */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-orange-700 mb-2">
              📈 Even Better If / Next Steps (EBI)
            </label>
            <textarea
              value={ebi}
              onChange={(e) => setEbi(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="What could the student improve?"
            />
          </div>

          {/* Overall */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              💬 Overall Feedback
            </label>
            <textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="General comments or summary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={() => navigate(`/teacher/assessments/${assessment.id}`)}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {attempt.status === 'marked' && (
            <>
              <button
                onClick={handleRegeneratePDF}
                disabled={regenerating}
                className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-medium"
              >
                {regenerating ? 'Regenerating...' : 'Regenerate PDF'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSubmissionDetailPage;
