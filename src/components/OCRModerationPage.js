import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '@/config';

export default function OCRModerationPage({ user }) {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [markingResult, setMarkingResult] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Editable fields
  const [totalScore, setTotalScore] = useState(0);
  const [www, setWww] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');

  // PDF Modal state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    try {
      // Fetch submission
      const submissionResponse = await fetch(`${API_URL}/api/ocr/submissions/${submissionId}`, {
        credentials: 'include'
      });
      if (!submissionResponse.ok) throw new Error('Failed to fetch submission');
      const submissionData = await submissionResponse.json();
      setSubmission(submissionData.submission);

      // Fetch marking result
      const markingResponse = await fetch(`${API_URL}/api/ocr/submissions/${submissionId}/marking`, {
        credentials: 'include'
      });
      if (!markingResponse.ok) throw new Error('Failed to fetch marking result');
      const markingData = await markingResponse.json();
      setMarkingResult(markingData);
      
      // Set initial values
      setTotalScore(markingData.total_score || 0);
      setWww(markingData.www || '');
      setNextSteps(markingData.next_steps || '');
      setOverallFeedback(markingData.overall_feedback || '');

      // Fetch assessment and question for context
      const assessmentResponse = await fetch(`${API_URL}/api/teacher/assessments`, {
        credentials: 'include'
      });
      if (assessmentResponse.ok) {
        const assessments = await assessmentResponse.json();
        const foundAssessment = assessments.find(a => a.id === submissionData.submission.assessment_id);
        setAssessment(foundAssessment);

        if (foundAssessment) {
          const questionResponse = await fetch(`${API_URL}/api/teacher/questions`, {
            credentials: 'include'
          });
          if (questionResponse.ok) {
            const questions = await questionResponse.json();
            const foundQuestion = questions.find(q => q.id === foundAssessment.question_id);
            setQuestion(foundQuestion);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/moderate`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            total_score: totalScore,
            www: www,
            next_steps: nextSteps,
            overall_feedback: overallFeedback
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      setSuccessMessage('Changes saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    setError('');

    try {
      // Save changes first
      await handleSaveChanges();

      // Finalize and generate PDF
      const response = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/finalize`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to finalize submission');
      }

      const data = await response.json();
      
      // Fetch the generated PDF
      setPdfLoading(true);
      const pdfResponse = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/download-pdf`,
        {
          credentials: 'include'
        }
      );

      if (!pdfResponse.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await pdfResponse.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setShowPdfModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setPdfLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfBlobUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    const filename = `${submission?.student_name || 'student'}_Feedback.pdf`.replace(/ /g, '_');
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleClosePdfModal = () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setPdfBlobUrl(null);
    setShowPdfModal(false);
    navigate('/teacher/dashboard', {
      state: { message: 'Submission finalized successfully!' }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marking results...</p>
        </div>
      </div>
    );
  }

  if (!submission || !markingResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Marking results not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Moderate AI Marking</h1>
            </div>
            <div className="text-sm text-gray-500">
              Student: <span className="font-medium text-gray-900">{submission.student_name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assessment Context */}
        {question && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Assessment Context</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-700">Subject:</span> {question.subject}</p>
              <p><span className="font-medium text-gray-700">Topic:</span> {question.topic}</p>
              <p><span className="font-medium text-gray-700">Maximum Marks:</span> {question.max_marks}</p>
              <div>
                <span className="font-medium text-gray-700">Question:</span>
                <p className="mt-1 text-gray-600">{question.question_text}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Generated Marks - Read Only */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">AI Generated Marks</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-800">Original Score</p>
              <p className="text-2xl font-bold text-blue-900">{markingResult.total_score} / {question?.max_marks || '?'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">What Went Well (AI)</p>
              <p className="text-sm text-blue-900 bg-white rounded p-3 mt-1">{markingResult.www}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Next Steps (AI)</p>
              <p className="text-sm text-blue-900 bg-white rounded p-3 mt-1">{markingResult.next_steps}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Overall Feedback (AI)</p>
              <p className="text-sm text-blue-900 bg-white rounded p-3 mt-1">{markingResult.overall_feedback}</p>
            </div>
          </div>
        </div>

        {/* Teacher Moderation - Editable */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Moderation</h2>
          <p className="text-sm text-gray-600 mb-6">Review and adjust the AI-generated marks and feedback below:</p>

          <div className="space-y-6">
            {/* Score Override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Score <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="0"
                  max={question?.max_marks || 100}
                  value={totalScore}
                  onChange={(e) => setTotalScore(parseInt(e.target.value) || 0)}
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                />
                <span className="text-lg font-medium text-gray-600">/ {question?.max_marks || '?'}</span>
              </div>
            </div>

            {/* WWW Override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What Went Well
              </label>
              <textarea
                value={www}
                onChange={(e) => setWww(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Highlight the student's strengths..."
              />
            </div>

            {/* Next Steps Override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Steps
              </label>
              <textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Suggest areas for improvement..."
              />
            </div>

            {/* Overall Feedback Override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Feedback
              </label>
              <textarea
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide a summary of the student's performance..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex space-x-4">
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={saving}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Processing...' : 'Finalize & Generate PDF'}
            </button>
            <button
              onClick={() => navigate('/teacher/dashboard')}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Feedback PDF Preview</h2>
                <p className="text-sm text-gray-600">
                  Student: {submission?.student_name}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handleClosePdfModal}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 overflow-hidden">
              {pdfLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-full border-0"
                  title="Feedback PDF Preview"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Failed to load PDF
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={handleClosePdfModal}
                className="bg-gray-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
