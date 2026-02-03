import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import LaTeXRenderer from '../components/LaTeXRenderer';
import { API } from '@/config';

export const EnhancedAssessmentDetailPage = ({ user }) => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [releasingIds, setReleasingIds] = useState(new Set());

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    try {
      const response = await axios.get(`${API}/teacher/assessments/${assessmentId}/enhanced`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading assessment:', error);
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
      console.error('Release feedback error:', error);
      alert(error.response?.data?.detail || 'Failed to release feedback');
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
      alert('Submission auto-marked successfully! Review the feedback before releasing.');
      loadData();
    } catch (error) {
      console.error('Auto-mark error:', error);
      alert(error.response?.data?.detail || 'Failed to auto-mark submission');
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
      alert(response.data.message);
      loadData();
    } catch (error) {
      console.error('Bulk release feedback error:', error);
      alert(error.response?.data?.detail || 'Failed to release feedback');
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
  const unreleasedCount = submissions?.filter(s => s.status === 'marked' && !s.feedback_released).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <button 
              onClick={() => navigate('/teacher/assessments')} 
              className="text-gray-700 hover:text-blue-600"
            >
              ← Back to Assessments
            </button>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

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
                  <p><strong>Join Code:</strong> <span className="text-blue-600 font-bold">{assessment.join_code}</span></p>
                  <p><strong>Submissions:</strong> {attempts_count}</p>
                </div>
              </div>
            </div>
          </div>

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
