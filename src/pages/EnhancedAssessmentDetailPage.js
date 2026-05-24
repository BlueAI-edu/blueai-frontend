import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import LaTeXRenderer from '../components/LaTeXRenderer';
import { Navbar } from '../components/Navbar';
import { API } from '@/config';
import { handleApiError, showSuccess } from '@/lib/handle-error';

export const EnhancedAssessmentDetailPage = ({ user }) => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [releasingIds, setReleasingIds] = useState(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState(null);
  const [detailAssignments, setDetailAssignments] = useState([]);

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    try {
      const [assessmentRes, assignmentsRes] = await Promise.all([
        axios.get(`${API}/teacher/assessments/${assessmentId}/enhanced`),
        axios.get(`${API}/teacher/assessments/${assessmentId}/assignments`).catch(() => ({ data: { assignments: [] } })),
      ]);
      setData(assessmentRes.data);
      setDetailAssignments(assignmentsRes.data.assignments || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleReleaseFeedback = async (attemptId) => {
    if (releasingIds.has(attemptId)) return;
    
    setReleasingIds(prev => new Set(prev).add(attemptId));

    try {
      await axios.post(`${API}/teacher/submissions/${attemptId}/release-feedback`);
      loadData();
    } catch (error) {
      handleApiError(error, 'Failed to release feedback');
    } finally {
      setReleasingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attemptId);
        return newSet;
      });
    }
  };

  const handleAutoMark = async (attemptId) => {
    if (releasingIds.has(attemptId)) return;
    
    if (!window.confirm('Use AI to automatically mark this submission? You can review and adjust the marks afterwards.')) {
      return;
    }
    
    setReleasingIds(prev => new Set(prev).add(attemptId));

    try {
      const response = await axios.post(`${API}/teacher/submissions/${attemptId}/auto-mark`);
      showSuccess('Submission auto-marked successfully! Review the feedback before releasing.');
      loadData();
    } catch (error) {
      handleApiError(error, 'Failed to auto-mark submission');
    } finally {
      setReleasingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attemptId);
        return newSet;
      });
    }
  };

  const handleBulkReleaseFeedback = async () => {
    if (!window.confirm('Release feedback for all marked submissions? Students will be able to see their feedback immediately.')) return;
    
    try {
      const response = await axios.post(`${API}/teacher/assessments/${assessmentId}/release-all-feedback`);
      showSuccess(response.data.message);
      loadData();
    } catch (error) {
      handleApiError(error, 'Failed to release feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-800">Assessment not found</p>
      </div>
    );
  }

  const { assessment, submissions, attempts_count } = data;
  const isFormative = assessment.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE';
  const isOcrLocked = assessment.assessmentMode === 'OCR_GENERATED_GCSE_PAST_PAPER' && assessment.ocrConfirmed;
  const unreleasedCount = submissions?.filter(s => s.status === 'marked' && !s.feedback_released).length || 0;

  const openAssignModal = async () => {
    setAssignResult(null);
    setSelectedClassId('');
    setShowAssignModal(true);
    try {
      const res = await axios.get(`${API}/teacher/classes`);
      setClasses(res.data.classes || []);
    } catch {
      setClasses([]);
    }
  };

  const handleAssign = async () => {
    if (!selectedClassId) return;
    setAssigning(true);
    try {
      const res = await axios.post(`${API}/teacher/assessments/${assessmentId}/assignments`, { class_id: selectedClassId });
      setAssignResult(res.data);
      loadData();
    } catch (error) {
      handleApiError(error, 'Failed to assign assessment');
    }
    setAssigning(false);
  };

  const handleUnlockOcr = async () => {
    if (!window.confirm(
      'Unlock this GCSE Past Paper assessment for re-extraction?\n\n' +
      'This will allow you to re-upload and re-extract questions from the PDF. ' +
      'Existing questions will remain until you re-extract. Continue?'
    )) return;
    try {
      await axios.post(`${API}/teacher/assessments/${assessmentId}/unlock-ocr`);
      showSuccess('Assessment unlocked. You can now re-upload and re-extract.');
      loadData();
    } catch (error) {
      handleApiError(error, 'Failed to unlock assessment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Assessment Header */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{assessment.title}</h2>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  ✨ {assessment.assessmentMode?.replace(/_/g, ' ')}
                </span>
                {isFormative && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Feedback Only
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Subject:</strong> {assessment.subject}</p>
                  <p><strong>Questions:</strong> {assessment.questions?.length || 0}</p>
                  {!isFormative && <p><strong>Total Marks:</strong> {assessment.totalMarks}</p>}
                </div>
                <div>
                  <p><strong>Duration:</strong> {assessment.durationMinutes} minutes</p>
                  {detailAssignments.length > 0 ? (
                    <div>
                      <strong>Class Join Codes:</strong>
                      <div className="mt-1 space-y-1">
                        {detailAssignments.map(a => (
                          <div key={a.id} className="flex items-center gap-2 text-sm">
                            <span className="font-mono font-bold text-blue-600">{a.join_code}</span>
                            <span className="text-gray-500">— {a.class_name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              a.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p><strong>Join Code:</strong> <span className="text-blue-600 font-bold">{assessment.join_code}</span></p>
                  )}
                  <p><strong>Submissions:</strong> {attempts_count}</p>
                </div>
              </div>
            </div>
            <div className="ml-4 shrink-0 flex flex-col gap-2">
              <button
                onClick={() => navigate(`/teacher/assessments/${assessmentId}/analytics`)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </button>
              <button
                onClick={openAssignModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Assign to Class
              </button>
            </div>
          </div>

          {/* OCR lock banner */}
          {isOcrLocked && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">GCSE Past Paper — OCR Review Confirmed</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This assessment is locked after teacher review. Questions and mark scheme are fixed.
                    To re-extract from the original PDF, unlock it below.
                  </p>
                </div>
              </div>
              <button
                onClick={handleUnlockOcr}
                className="shrink-0 px-3 py-1.5 text-xs font-medium border border-amber-400 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Unlock for re-extraction
              </button>
            </div>
          )}

          {/* Bulk Actions */}
          {unreleasedCount > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  <strong>{unreleasedCount}</strong> marked submission(s) waiting to be released
                </p>
                <button
                  onClick={handleBulkReleaseFeedback}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  Release All Feedback
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submissions List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Student Submissions</h3>

          {submissions && submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div 
                  key={submission.attempt_id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {submission.student_name}
                        </h4>
                        <StatusBadge status={submission.status} />
                        {submission.feedback_released && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Released
                          </span>
                        )}
                        {submission.autosubmitted && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            Auto-submitted
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Submitted:</strong>{' '}
                          {submission.submitted_at 
                            ? new Date(submission.submitted_at).toLocaleString() 
                            : 'N/A'}
                        </p>
                        {submission.status === 'marked' && !isFormative && submission.score !== null && (
                          <p>
                            <strong>Score:</strong> {submission.score} / {assessment.totalMarks}
                          </p>
                        )}
                        {submission.status === 'marked' && submission.marked_at && (
                          <p>
                            <strong>Marked:</strong>{' '}
                            {new Date(submission.marked_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/teacher/submissions/${submission.attempt_id}/enhanced`)}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        {submission.status === 'marked' ? 'View' : 'Mark'}
                      </button>
                      
                      {submission.status === 'marked' && !submission.feedback_released && (
                        <button
                          onClick={() => handleReleaseFeedback(submission.attempt_id)}
                          disabled={releasingIds.has(submission.attempt_id)}
                          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                        >
                          {releasingIds.has(submission.attempt_id) ? 'Releasing...' : 'Release'}
                        </button>
                      )}
                      
                      {submission.status === 'submitted' && !submission.auto_marked && (
                        <button
                          onClick={() => handleAutoMark(submission.attempt_id)}
                          disabled={releasingIds.has(submission.attempt_id)}
                          className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
                        >
                          {releasingIds.has(submission.attempt_id) ? 'Marking...' : '🤖 Auto-Mark'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No submissions yet</p>
              <p className="text-sm mt-2">Students can join using code: <strong className="text-blue-600">{assessment.join_code}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Assign to Class Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Assign to Class</h2>
              <button onClick={() => { setShowAssignModal(false); setAssignResult(null); }} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {assignResult ? (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-900">Assigned to {assignResult.class_name}!</p>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Student join code</p>
                    <p className="text-3xl font-mono font-bold text-blue-700 tracking-widest">{assignResult.assignment.join_code}</p>
                    <p className="text-xs text-gray-500 mt-2">Share this code with students in {assignResult.class_name}.</p>
                  </div>
                  <button
                    onClick={() => { setShowAssignModal(false); setAssignResult(null); }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    {classes.length === 0 ? (
                      <p className="text-sm text-gray-500">No classes found. Create a class first.</p>
                    ) : (
                      <select
                        value={selectedClassId}
                        onChange={e => setSelectedClassId(e.target.value)}
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select a class --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.class_name}{c.year_group ? ` (Year ${c.year_group})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setShowAssignModal(false); setAssignResult(null); }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedClassId || assigning}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {assigning ? 'Assigning...' : 'Assign & Generate Code'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const colors = {
    in_progress: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-blue-100 text-blue-800',
    marked: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.in_progress}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

export default EnhancedAssessmentDetailPage;
