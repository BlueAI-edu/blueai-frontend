import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '@/config';
import { useAsync } from '../hooks/use-async';
import { useToast } from '@/hooks/use-toast';

export default function OCRModerationPage({ user }) {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const { toast } = useToast();
  const [submission, setSubmission] = useState(null);
  const [markingResult, setMarkingResult] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runSave, saving] = useAsync();
  const [savingChanges, setSavingChanges] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [totalScore, setTotalScore] = useState(0);
  const [www, setWww] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');

  useEffect(() => {
    fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    try {
      const submissionResponse = await fetch(`${API_URL}/api/ocr/submissions/${submissionId}`, {
        credentials: 'include'
      });
      if (!submissionResponse.ok) throw new Error('Failed to fetch submission');
      const submissionData = await submissionResponse.json();
      setSubmission(submissionData.submission);

      const markingResponse = await fetch(`${API_URL}/api/ocr/submissions/${submissionId}/marking`, {
        credentials: 'include'
      });
      if (!markingResponse.ok) throw new Error('Failed to fetch marking result');
      const markingData = await markingResponse.json();
      setMarkingResult(markingData);

      setTotalScore(markingData.total_score || 0);
      setWww(markingData.www || '');
      setNextSteps(markingData.next_steps || '');
      setOverallFeedback(markingData.overall_feedback || '');

      const assessmentResponse = await fetch(`${API_URL}/api/teacher/assessments`, {
        credentials: 'include'
      });
      if (assessmentResponse.ok) {
        const assessments = await assessmentResponse.json();
        const foundAssessment = assessments.find(a => a.id === submissionData.submission.assessment_id);
        setAssessment(foundAssessment);

        if (foundAssessment && foundAssessment.question_id) {
          const questionResponse = await fetch(`${API_URL}/api/teacher/questions`, {
            credentials: 'include'
          });
          if (questionResponse.ok) {
            const questions = await questionResponse.json();
            const foundQuestion = questions.find(q => q.id === foundAssessment.question_id);
            setQuestion(foundQuestion);
          }
        } else if (foundAssessment && foundAssessment.questions?.length > 0) {
          setQuestion({
            subject: foundAssessment.subject || foundAssessment.title,
            topic: foundAssessment.title || '',
            max_marks: foundAssessment.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
            question_text: foundAssessment.questions.map((q, i) => `Q${i + 1}: ${q.question_text || ''}`).join('\n'),
          });
        }
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSavingChanges(true);
    try {
      const response = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/moderate`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
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

      toast({ title: "Saved", description: "Changes saved successfully." });
    } catch (err) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
      throw err;
    } finally {
      setSavingChanges(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await handleSaveChanges();
    } catch (saveErr) {
      toast({ title: "Error", description: "Failed to save changes before finalizing.", variant: "destructive" });
      setFinalizing(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/finalize`,
        {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        let detail = 'Failed to finalize submission. Please try again.';
        try {
          const body = await response.json();
          if (body?.detail) detail = body.detail;
        } catch (_) {}
        throw new Error(detail);
      }
    } catch (err) {
      toast({ title: "Finalize Failed", description: err.message, variant: "destructive" });
      setFinalizing(false);
      return;
    }

    try {
      const pdfResponse = await fetch(
        `${API_URL}/api/ocr/submissions/${submissionId}/download-pdf`,
        { credentials: 'include' }
      );

      if (!pdfResponse.ok) {
        throw new Error('PDF was generated but could not be downloaded.');
      }

      const blob = await pdfResponse.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `${submission?.student_name || 'student'}_Feedback.pdf`.replace(/ /g, '_');
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast({ title: "Finalized", description: "Submission finalized and PDF downloaded." });

      navigate('/teacher/dashboard', {
        state: { message: 'Submission finalized and PDF downloaded!' }
      });
    } catch (pdfErr) {
      toast({ title: "Download Failed", description: pdfErr.message || 'Failed to download PDF. You can download it from the dashboard.', variant: "destructive" });
    } finally {
      setFinalizing(false);
    }
  };

  const isBusy = savingChanges || finalizing;

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

        {/* Review Warnings */}
        {markingResult.review_warnings && markingResult.review_warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-amber-800">
              Review needed for questions: {markingResult.review_warnings.join(', ')}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              These questions had low extraction confidence and may need review.
            </p>
          </div>
        )}

        {/* Per-Question AI Marks */}
        {markingResult.per_question_feedback && markingResult.per_question_feedback.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-indigo-900 mb-3">Per-Question AI Marks</h2>
            <div className="space-y-3">
              {markingResult.per_question_feedback.map((qf, idx) => (
                <div key={qf.question_ref || idx} className="bg-white rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-indigo-900">Q{qf.question_ref}</span>
                    <span className="text-lg font-bold text-indigo-800">
                      {qf.score} / {qf.max_marks}
                    </span>
                  </div>
                  {qf.feedback && (
                    <p className="text-sm text-gray-700">{qf.feedback}</p>
                  )}
                  {qf.warning && (
                    <p className="text-xs text-amber-600 mt-1">Warning: {qf.warning}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Generated Marks - Read Only */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">AI Generated Marks (Overall)</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Score</p>
              <p className="text-2xl font-bold text-blue-900">{markingResult.total_score} / {markingResult.max_marks || question?.max_marks || '?'}</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Score <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="0"
                  max={markingResult?.max_marks || question?.max_marks || 100}
                  value={totalScore}
                  onChange={(e) => setTotalScore(parseInt(e.target.value) || 0)}
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  disabled={isBusy}
                />
                <span className="text-lg font-medium text-gray-600">/ {markingResult?.max_marks || question?.max_marks || '?'}</span>
              </div>
            </div>

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
                disabled={isBusy}
              />
            </div>

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
                disabled={isBusy}
              />
            </div>

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
                disabled={isBusy}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex space-x-4">
            <button
              onClick={handleSaveChanges}
              disabled={isBusy}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {savingChanges && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {savingChanges ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={isBusy}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {finalizing && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {finalizing ? 'Finalizing...' : 'Finalize & Download PDF'}
            </button>
            <button
              onClick={() => navigate('/teacher/dashboard')}
              disabled={isBusy}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
