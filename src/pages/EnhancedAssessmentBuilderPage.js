import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';
import { useAsync } from '@/hooks/use-async';

const AssessmentModeSelector = lazy(() => import('../components/EnhancedAssessmentBuilder/AssessmentModeSelector'));
const QuestionEditor = lazy(() => import('../components/EnhancedAssessmentBuilder/QuestionEditor'));
const AIBulkGenerator = lazy(() => import('../components/EnhancedAssessmentBuilder/AIBulkGenerator'));
const OCRExtractionReview = lazy(() => import('../components/EnhancedAssessmentBuilder/OCRExtractionReview'));

export const EnhancedAssessmentBuilderPage = ({ user }) => {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const isEdit = !!assessmentId;

  const [loading, setLoading] = useState(isEdit);
  const [runSave, saving] = useAsync();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

  const [assessmentData, setAssessmentData] = useState({
    assessmentMode: '',
    title: '',
    subject: 'Mathematics',
    stage: 'KS4',
    examBoard: 'AQA',
    tier: 'Higher',
    yearSeries: '',
    durationMinutes: 90,
    instructions: '',
    shuffleQuestions: false,
    shuffleOptions: false,
    allowDraftSaving: true,
    markingStrictness: 'STANDARD_STRICT',
    calculatorAllowed: false,
    mathKeyboardEnabled: false,
    questions: [],
    class_id: null
  });

  const [showAIBulk, setShowAIBulk] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStuck, setExtractStuck] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [questionPaperFile, setQuestionPaperFile] = useState(null);
  const [markSchemeFile, setMarkSchemeFile] = useState(null);
  const [questionPaperError, setQuestionPaperError] = useState(null);
  const [markSchemeError, setMarkSchemeError] = useState(null);

  // OCR sub-flow state: 'uploading' → 'reviewing' → 'editing'
  const [ocrReviewState, setOcrReviewState] = useState('uploading');
  const [extractionSummary, setExtractionSummary] = useState(null);
  const [pageThumbnails, setPageThumbnails] = useState({});
  const [pageImages, setPageImages] = useState({});
  const [msPageThumbnails, setMsPageThumbnails] = useState({});

  const OCR_GCSE_MODE = 'OCR_GENERATED_GCSE_PAST_PAPER';

  const validatePdfFile = (file) => {
    if (!file) return null;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf') return `Only PDF files are accepted. Received: "${file.name}". Please re-upload as a PDF.`;
    if (file.size > 50 * 1024 * 1024) return 'File exceeds 50 MB. Please upload a smaller PDF.';
    return null;
  };

  const handleQuestionPaperChange = useCallback((e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const err = validatePdfFile(file);
    if (err) { setQuestionPaperError(err); return; }
    setQuestionPaperError(null);
    setQuestionPaperFile(file);
  }, []);

  const handleMarkSchemeChange = useCallback((e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const err = validatePdfFile(file);
    if (err) { setMarkSchemeError(err); return; }
    setMarkSchemeError(null);
    setMarkSchemeFile(file);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!questionPaperFile && !markSchemeFile) {
      setExtractError('Please upload at least one PDF (question paper or mark scheme) before extracting.');
      return;
    }
    setExtracting(true);
    setExtractError(null);
    setExtractProgress(0);

    // Simulate progress: advances quickly at first then decelerates, asymptotically
    // approaching 98% so the bar keeps moving even on slow extractions.
    const progressInterval = setInterval(() => {
      setExtractProgress(prev => Math.min(98, Math.round(prev + (98 - prev) * 0.04)));
    }, 500);

    const formData = new FormData();
    if (questionPaperFile) formData.append('file', questionPaperFile);
    if (markSchemeFile) formData.append('mark_scheme', markSchemeFile);
    formData.append('subject', assessmentData.subject);
    formData.append('exam_board', assessmentData.examBoard);
    try {
      const response = await axios.post(
        `${API}/teacher/assessments/extract-past-paper`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      clearInterval(progressInterval);
      setExtractProgress(100);
      // Let the user see 100% before the page transitions.
      await new Promise(resolve => setTimeout(resolve, 600));
      const questions = response.data.questions.map((q, i) => ({ ...q, questionNumber: i + 1 }));
      setAssessmentData(prev => ({ ...prev, questions }));
      setExtractionSummary(response.data.extraction_summary || null);
      setPageThumbnails(response.data.page_thumbnails || {});
      setPageImages(response.data.page_images || {});
      setMsPageThumbnails(response.data.ms_page_thumbnails || {});
      setOcrReviewState('reviewing');
      showNotification(
        `${questions.length} question${questions.length !== 1 ? 's' : ''} extracted — please review before confirming`,
        'success'
      );
    } catch (error) {
      clearInterval(progressInterval);
      setExtractProgress(0);
      const msg = getApiErrorMessage(error, 'Failed to extract questions from the uploaded PDF');
      setExtractError(msg);
      showNotification(msg, 'error');
    } finally {
      setExtracting(false);
    }
  }, [questionPaperFile, markSchemeFile, assessmentData.subject, assessmentData.examBoard]);

  const handleOcrReviewConfirm = useCallback((reviewedQuestions) => {
    setAssessmentData(prev => ({ ...prev, questions: reviewedQuestions }));
    setOcrReviewState('editing');
    showNotification('Extraction confirmed. You can now edit individual questions in detail.', 'success');
  }, []);

  const handleOcrReviewBack = useCallback(() => {
    setAssessmentData(prev => ({ ...prev, questions: [] }));
    setExtractionSummary(null);
    setPageThumbnails({});
    setPageImages({});
    setMsPageThumbnails({});
    setOcrReviewState('uploading');
  }, []);

  // Show a "do not refresh" warning if extractProgress hasn't changed for 5 seconds.
  // Re-runs every time extractProgress changes, resetting the timer each time.
  useEffect(() => {
    if (!extracting || extractProgress >= 100) {
      setExtractStuck(false);
      return;
    }
    const timer = setTimeout(() => setExtractStuck(true), 5000);
    return () => clearTimeout(timer);
  }, [extractProgress, extracting]);

  useEffect(() => {
    if (isEdit) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      const response = await axios.get(`${API}/teacher/assessments/${assessmentId}/enhanced`);
      const assessment = response.data.assessment;

      if (assessment.status === 'closed') {
        showNotification('This assessment is closed. Reopen it from the Assessments list before editing.', 'error');
        setTimeout(() => navigate('/teacher/assessments'), 2000);
        return;
      }

      if (assessment.status === 'started') {
        showNotification('This assessment is live and cannot be edited while students are taking it.', 'error');
        setTimeout(() => navigate('/teacher/assessments'), 2000);
        return;
      }

      if (assessment.assessmentMode === OCR_GCSE_MODE && assessment.ocrConfirmed) {
        // Locked OCR assessment — redirect to detail page with a message
        showNotification(
          'This GCSE Past Paper assessment is locked after review. To re-extract, use "Unlock for re-extraction" on the assessment detail page.',
          'error'
        );
        setTimeout(() => navigate(`/teacher/assessments/${assessmentId}/enhanced`), 2500);
        return;
      }

      setAssessmentData(assessment);
      setCurrentStep(3);
      setLoading(false);
    } catch (error) {
      showNotification(getApiErrorMessage(error, 'Failed to load assessment'), 'error');
      navigate('/teacher/assessments');
    }
  };

  const updateField = useCallback((field, value) => {
    setAssessmentData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addQuestion = useCallback(() => {
    setAssessmentData(prev => {
      const isFormative = prev.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE';
      const newQuestion = {
        questionNumber: prev.questions.length + 1,
        questionType: isFormative ? 'LONG_RESPONSE' : '',
        questionBody: '',
        stimulusBlock: null,
        maxMarks: isFormative ? 6 : 1,
        subject: prev.subject,
        topic: '',
        difficulty: 'Medium',
        tags: [],
        options: [],
        allowMultiSelect: false,
        parts: [],
        answerType: 'TEXT',
        calculatorAllowed: false,
        markScheme: '',
        modelAnswer: '',
        source: 'manual'
      };
      return { ...prev, questions: [...prev.questions, newQuestion] };
    });
  }, []);

  const updateQuestion = useCallback((index, updatedQuestion) => {
    setAssessmentData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = updatedQuestion;
      return { ...prev, questions: newQuestions };
    });
  }, []);

  const removeQuestion = useCallback((index) => {
    setAssessmentData(prev => {
      const newQuestions = prev.questions.filter((_, i) => i !== index);
      const renumbered = newQuestions.map((q, i) => ({ ...q, questionNumber: i + 1 }));
      return { ...prev, questions: renumbered };
    });
  }, []);

  const handleAIBulkGenerate = useCallback((questions) => {
    setAssessmentData(prev => {
      const numbered = questions.map((q, i) => ({
        ...q,
        questionNumber: prev.questions.length + i + 1
      }));
      return { ...prev, questions: [...prev.questions, ...numbered] };
    });
    setShowAIBulk(false);
  }, []);

  const showNotification = (message, type = 'info') => {
    // Handle error objects/arrays
    let displayMessage = message;
    if (typeof message === 'object') {
      if (Array.isArray(message)) {
        // Pydantic validation errors
        displayMessage = message.map(err => err.msg || JSON.stringify(err)).join(', ');
      } else {
        displayMessage = message.message || JSON.stringify(message);
      }
    }
    
    setNotification({ show: true, message: displayMessage, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  const validateAssessment = () => {
    if (!assessmentData.title.trim()) {
      showNotification('Please enter an assessment title', 'error');
      return false;
    }

    if (assessmentData.questions.length === 0) {
      showNotification('Please add at least one question', 'error');
      return false;
    }

    if (assessmentData.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE') {
      if (assessmentData.questions.length !== 1) {
        showNotification('Formative mode requires exactly 1 long-response question', 'error');
        return false;
      }
      if (assessmentData.questions[0]?.questionType !== 'LONG_RESPONSE') {
        showNotification('Formative mode requires a long-response question', 'error');
        return false;
      }
    }

    if (assessmentData.assessmentMode === 'SUMMATIVE_MULTI_QUESTION' && (assessmentData.questions.length < 5 || assessmentData.questions.length > 20)) {
      showNotification('Summative mode requires 5-20 questions', 'error');
      return false;
    }

    const isOcrMode = assessmentData.assessmentMode === OCR_GCSE_MODE;

    for (const q of assessmentData.questions) {
      if (!q.questionBody.trim()) {
        showNotification(`Question ${q.questionNumber} is missing question text`, 'error');
        return false;
      }
      // Skip mark-range enforcement for OCR-extracted questions — marks come directly from the
      // mark scheme and may legitimately be outside the 6-15 range used for teacher-authored questions
      if (!isOcrMode && q.questionType === 'LONG_RESPONSE' && (q.maxMarks < 6 || q.maxMarks > 15)) {
        showNotification(`Question ${q.questionNumber} is a Long Response question and must be between 6 and 15 marks`, 'error');
        return false;
      }
    }

    return true;
  };

  const saveDraft = () => {
    if (!validateAssessment()) return;

    const isOcrMode = assessmentData.assessmentMode === OCR_GCSE_MODE;

    runSave(
      async () => {
        if (isEdit) {
          await axios.put(`${API}/teacher/assessments/${assessmentId}/questions`, {
            questions: assessmentData.questions,
            calculatorAllowed: assessmentData.calculatorAllowed,
            mathKeyboardEnabled: assessmentData.mathKeyboardEnabled,
          });
          // For OCR assessments being re-saved after edits, ocrConfirmed stays as-is
          showNotification('Draft saved successfully!', 'success');
        } else {
          // Set ocrConfirmed=true for OCR mode so teacher has explicitly reviewed extraction
          const payload = isOcrMode ? { ...assessmentData, ocrConfirmed: true } : assessmentData;
          const response = await axios.post(`${API}/teacher/assessments/enhanced`, payload);
          const newId = response.data.assessment.id;
          showNotification('Assessment created as draft!', 'success');
          navigate(`/teacher/assessments/${newId}/enhanced`);
        }
      },
      (error) => {
        showNotification(getApiErrorMessage(error, 'Failed to save'), 'error');
      }
    );
  };

  const handlePublishClick = () => {
    if (!validateAssessment()) return;
    setShowPublishConfirm(true);
  };

  const confirmPublish = () => {
    setShowPublishConfirm(false);
    const isOcrMode = assessmentData.assessmentMode === OCR_GCSE_MODE;

    runSave(
      async () => {
        let finalAssessmentId = assessmentId;

        if (!isEdit) {
          const payload = isOcrMode ? { ...assessmentData, ocrConfirmed: true } : assessmentData;
          const response = await axios.post(`${API}/teacher/assessments/enhanced`, payload);
          finalAssessmentId = response.data.assessment.id;
        } else {
          await axios.put(`${API}/teacher/assessments/${assessmentId}/questions`, {
            questions: assessmentData.questions,
            calculatorAllowed: assessmentData.calculatorAllowed,
            mathKeyboardEnabled: assessmentData.mathKeyboardEnabled,
          });
        }

        await axios.post(`${API}/teacher/assessments/${finalAssessmentId}/publish`);
        showNotification('Assessment published successfully!', 'success');
        setTimeout(() => navigate('/teacher/assessments'), 1500);
      },
      (error) => {
        showNotification(getApiErrorMessage(error, 'Failed to publish'), 'error');
      }
    );
  };

  const cancelPublish = () => {
    setShowPublishConfirm(false);
  };

  const totalMarks = useMemo(() => assessmentData.questions.reduce((sum, q) => {
    if (q.questionType === 'STRUCTURED_WITH_PARTS') {
      return sum + (q.parts || []).reduce((pSum, p) => pSum + (p.maxMarks || 0), 0);
    }
    return sum + (q.maxMarks || 0);
  }, 0), [assessmentData.questions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Assessment' : 'Create New Assessment'}
              </h1>
              <p className="text-sm text-gray-600">
                {assessmentData.assessmentMode === OCR_GCSE_MODE && currentStep === 3
                  ? ocrReviewState === 'uploading' ? 'Step 3 of 4 — Upload'
                    : ocrReviewState === 'reviewing' ? 'Step 4 of 4 — Review Extraction'
                    : 'Step 4 of 4 — Edit Questions'
                  : `Step ${currentStep} of 3`}
              </p>
            </div>
            <button
              onClick={() => navigate('/teacher/assessments')}
              className="text-gray-600 hover:text-gray-900"
            >
              ✕ Close
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            {assessmentData.assessmentMode === OCR_GCSE_MODE ? (
              <>
                <div className={`flex-1 h-1 rounded ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1 rounded ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1 rounded ${ocrReviewState !== 'uploading' ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </>
            ) : (
              <>
                <div className={`flex-1 h-1 rounded ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1 rounded ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}>
              <AssessmentModeSelector
                selectedMode={assessmentData.assessmentMode}
                onModeChange={(mode) => updateField('assessmentMode', mode)}
              />
            </Suspense>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!assessmentData.assessmentMode}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Assessment Details →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && assessmentData.assessmentMode === OCR_GCSE_MODE && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Past Paper Details</h2>
              <p className="text-sm text-gray-500 mt-1">Enter the metadata for this past paper session. Title and subject are required.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Title *</label>
              <input
                type="text"
                value={assessmentData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., AQA Mathematics Higher — June 2023 Paper 1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${!assessmentData.title.trim() ? 'border-red-300' : ''}`}
              />
              {!assessmentData.title.trim() && <p className="mt-1 text-xs text-red-500">Title is required</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select
                  value={assessmentData.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                  <option>Combined Science</option>
                  <option>English Language</option>
                  <option>English Literature</option>
                  <option>History</option>
                  <option>Geography</option>
                  <option>Computer Science</option>
                  <option>Business Studies</option>
                  <option>Economics</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Board / Source</label>
                <select
                  value={assessmentData.examBoard}
                  onChange={(e) => updateField('examBoard', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>AQA</option>
                  <option>Edexcel</option>
                  <option>OCR</option>
                  <option>WJEC</option>
                  <option>CIE</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier <span className="text-gray-400 font-normal">(optional)</span></label>
                <select
                  value={assessmentData.tier}
                  onChange={(e) => updateField('tier', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Higher</option>
                  <option>Foundation</option>
                  <option>Intermediate</option>
                  <option>None</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year / Series <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={assessmentData.yearSeries}
                  onChange={(e) => updateField('yearSeries', e.target.value)}
                  placeholder="e.g., June 2023 Paper 1"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) — 1 to 120</label>
              <input
                type="number"
                min="1"
                max="120"
                value={assessmentData.durationMinutes}
                onChange={(e) => updateField('durationMinutes', parseInt(e.target.value) || 90)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Student tools</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assessmentData.calculatorAllowed}
                    onChange={(e) => updateField('calculatorAllowed', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Calculator</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assessmentData.mathKeyboardEnabled}
                    onChange={(e) => updateField('mathKeyboardEnabled', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Maths keyboard</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">Enabled tools appear as toggle buttons on the right side of the student's screen during the assessment.</p>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button onClick={() => setCurrentStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button>
              <button
                onClick={() => {
                  if (!assessmentData.title.trim()) { showNotification('Assessment title is required', 'error'); return; }
                  if (!assessmentData.subject) { showNotification('Subject is required', 'error'); return; }
                  setCurrentStep(3);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next: Upload Papers →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && assessmentData.assessmentMode !== OCR_GCSE_MODE && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Assessment Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Title *</label>
              <input
                type="text"
                value={assessmentData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Quadratic Equations Mid-Term Assessment"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={assessmentData.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                  <option>English</option>
                  <option>History</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={assessmentData.stage}
                  onChange={(e) => updateField('stage', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>KS3</option>
                  <option>KS4</option>
                  <option>KS5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Board</label>
                <select
                  value={assessmentData.examBoard}
                  onChange={(e) => updateField('examBoard', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>AQA</option>
                  <option>Edexcel</option>
                  <option>OCR</option>
                  <option>WJEC</option>
                  <option>CIE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select
                  value={assessmentData.tier}
                  onChange={(e) => updateField('tier', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Foundation</option>
                  <option>Higher</option>
                  <option>Intermediate</option>
                  <option>None</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) — 1 to 120</label>
              <input
                type="number"
                min="1"
                max="120"
                value={assessmentData.durationMinutes}
                onChange={(e) => updateField('durationMinutes', parseInt(e.target.value) || 45)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (Optional)</label>
              <textarea
                value={assessmentData.instructions}
                onChange={(e) => updateField('instructions', e.target.value)}
                placeholder="Add any special instructions for students..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {assessmentData.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formative Marking Strictness</label>
                <select
                  value={assessmentData.markingStrictness}
                  onChange={(e) => updateField('markingStrictness', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STANDARD_STRICT">Standard Strict</option>
                  <option value="SUPPORTIVE_STRICT">Supportive-Strict</option>
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assessmentData.shuffleQuestions}
                  onChange={(e) => updateField('shuffleQuestions', e.target.checked)}
                  disabled={assessmentData.assessmentMode !== 'SUMMATIVE_MULTI_QUESTION'}
                  className="rounded"
                />
                <span className="text-sm">Shuffle questions</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assessmentData.shuffleOptions}
                  onChange={(e) => updateField('shuffleOptions', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Shuffle MCQ options</span>
              </label>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Student tools</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assessmentData.calculatorAllowed}
                    onChange={(e) => updateField('calculatorAllowed', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Calculator</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assessmentData.mathKeyboardEnabled}
                    onChange={(e) => updateField('mathKeyboardEnabled', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Maths keyboard</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">Enabled tools appear as toggle buttons on the right side of the student's screen during the assessment.</p>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button onClick={() => setCurrentStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">← Back</button>
              <button onClick={() => setCurrentStep(3)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Next: Add Questions →
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{assessmentData.title || 'Untitled Assessment'}</h2>
                  <div className="flex flex-wrap gap-4 text-sm opacity-90">
                    <span>📚 {assessmentData.subject}</span>
                    <span>⏱️ {assessmentData.durationMinutes} minutes</span>
                    <span>📝 {assessmentData.questions.length} questions</span>
                    <span>🎯 {totalMarks} marks</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium"
                >
                  Edit Details
                </button>
              </div>
            </div>

            {assessmentData.assessmentMode === OCR_GCSE_MODE && ocrReviewState === 'uploading' && (
              <div className="bg-white rounded-lg shadow p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload Exam Documents</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload the question paper to extract questions automatically. Adding the mark scheme enables AI to pre-fill mark schemes for each question. PDF files only.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Question Paper */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Paper PDF <span className="text-gray-400 font-normal">(primary)</span></label>
                    <label className={`flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-lg transition-colors ${
                      extracting ? 'cursor-not-allowed opacity-60' :
                      questionPaperFile ? 'border-green-400 bg-green-50 hover:bg-green-100 cursor-pointer' :
                      'border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 cursor-pointer'
                    }`}>
                      <span className="text-3xl mb-1">{questionPaperFile ? '✅' : '📄'}</span>
                      <span className="font-medium text-sm text-gray-800 text-center px-2">
                        {questionPaperFile ? questionPaperFile.name : 'Click to upload question paper'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">PDF only — up to 50 MB</span>
                      <input type="file" accept=".pdf" className="hidden" disabled={extracting} onChange={handleQuestionPaperChange} />
                    </label>
                    {questionPaperError && (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{questionPaperError}</p>
                    )}
                    {questionPaperFile && !extracting && (
                      <button onClick={() => setQuestionPaperFile(null)} className="mt-1 text-xs text-gray-400 hover:text-red-500 underline">Remove</button>
                    )}
                  </div>

                  {/* Mark Scheme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mark Scheme PDF <span className="text-gray-400 font-normal">(optional — pre-fills mark schemes)</span></label>
                    <label className={`flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-lg transition-colors ${
                      extracting ? 'cursor-not-allowed opacity-60' :
                      markSchemeFile ? 'border-green-400 bg-green-50 hover:bg-green-100 cursor-pointer' :
                      'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer'
                    }`}>
                      <span className="text-3xl mb-1">{markSchemeFile ? '✅' : '📋'}</span>
                      <span className="font-medium text-sm text-gray-800 text-center px-2">
                        {markSchemeFile ? markSchemeFile.name : 'Click to upload mark scheme'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">PDF only — enables mark scheme pre-fill</span>
                      <input type="file" accept=".pdf" className="hidden" disabled={extracting} onChange={handleMarkSchemeChange} />
                    </label>
                    {markSchemeError && (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{markSchemeError}</p>
                    )}
                    {markSchemeFile && !extracting && (
                      <button onClick={() => setMarkSchemeFile(null)} className="mt-1 text-xs text-gray-400 hover:text-red-500 underline">Remove</button>
                    )}
                  </div>
                </div>

                {!questionPaperFile && markSchemeFile && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      ⚠️ No question paper uploaded. AI will infer questions from the mark scheme only — question text will be placeholder text that you must fill in manually after extraction.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-500">
                    {questionPaperFile && markSchemeFile ? '✓ Question paper + mark scheme ready' :
                     questionPaperFile ? '✓ Question paper ready' :
                     markSchemeFile ? '⚠ Mark scheme only' : 'No files selected'}
                  </span>
                  <button
                    onClick={handleExtract}
                    disabled={extracting || (!questionPaperFile && !markSchemeFile)}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    {extracting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Extracting…
                      </>
                    ) : (
                      '🔍 Extract Questions'
                    )}
                  </button>
                </div>

                {extracting && (
                  <div className="pt-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Extracting questions from PDF…</span>
                      <span>{extractProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${extractProgress}%` }}
                      />
                    </div>
                    {extractStuck && (
                      <p className="mt-2 text-xs font-medium text-amber-700 flex items-center gap-1.5">
                        <span>⚠</span>
                        Large papers can take a while — do not refresh this page or your upload will be lost.
                      </p>
                    )}
                  </div>
                )}

                {extractError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{extractError}</p>
                )}

                {!extracting && !questionPaperFile && !markSchemeFile && (
                  <p className="text-sm text-gray-400 text-center">Upload at least one document above, then click Extract Questions to begin.</p>
                )}
              </div>
            )}

            {/* ── OCR Review step ── */}
            {assessmentData.assessmentMode === OCR_GCSE_MODE && ocrReviewState === 'reviewing' && (
              <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading review…</div>}>
                <OCRExtractionReview
                  questions={assessmentData.questions}
                  pageThumbnails={pageThumbnails}
                  pageImages={pageImages}
                  msPageThumbnails={msPageThumbnails}
                  onConfirm={handleOcrReviewConfirm}
                  onBack={handleOcrReviewBack}
                />
              </Suspense>
            )}

            {(assessmentData.assessmentMode !== OCR_GCSE_MODE || ocrReviewState === 'editing') && (
            <div className="space-y-4">
              {assessmentData.questions.map((question, index) => (
                <Suspense key={index} fallback={<div className="p-4 bg-white rounded-lg shadow text-center text-gray-500">Loading question...</div>}>
                  <QuestionEditor
                    key={index}
                    question={question}
                    questionIndex={index}
                    onQuestionChange={updateQuestion}
                    onRemove={removeQuestion}
                    assessmentMode={assessmentData.assessmentMode}
                    assessmentId={assessmentId}
                  />
                </Suspense>
              ))}

              <div className="flex gap-3">
                <button
                  onClick={addQuestion}
                  disabled={assessmentData.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE' && assessmentData.questions.length >= 1}
                  className="flex-1 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  + Add Question Manually
                </button>
                {assessmentData.assessmentMode !== OCR_GCSE_MODE && assessmentData.assessmentMode !== 'FORMATIVE_SINGLE_LONG_RESPONSE' && (
                  <button
                    onClick={() => setShowAIBulk(true)}
                    className="flex-1 py-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  >
                    🤖 Generate Multiple Questions with AI
                  </button>
                )}
              </div>
            </div>
            )}

            {showAIBulk && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">AI Bulk Question Generator</h3>
                      <button
                        onClick={() => setShowAIBulk(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading AI generator...</div>}>
                      <AIBulkGenerator
                        onQuestionsGenerated={handleAIBulkGenerate}
                        assessmentMode={assessmentData.assessmentMode}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            )}

            {/* Hide Save/Publish while the OCR review is in progress — teacher must complete review first */}
            {(assessmentData.assessmentMode !== OCR_GCSE_MODE || ocrReviewState === 'editing') && (
              <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center sticky bottom-0">
                <button
                  onClick={saveDraft}
                  disabled={saving}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '💾 Save Draft'}
                </button>
                <button
                  onClick={handlePublishClick}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-medium disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : '🚀 Publish Assessment'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="mb-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Publish Assessment?
              </h3>
              <p className="text-center text-gray-600">
                Are you sure you want to publish this assessment? Students will be able to access it immediately.
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelPublish}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-600' :
            notification.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          } text-white`}>
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
