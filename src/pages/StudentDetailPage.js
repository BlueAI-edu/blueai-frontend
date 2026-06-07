import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';
import { Navbar } from '@/components/Navbar';
import { PageLoader } from '@/components/common';

export const StudentDetailPage = ({ user }) => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/teacher/students/${studentId}`);
        setData(res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load student'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  if (loading) return <PageLoader />;

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      </div>
    </div>
  );

  const { student, class: cls, submissions, stats } = data;

  const displayName = student.preferred_name
    ? `${student.first_name} "${student.preferred_name}" ${student.last_name}`
    : `${student.first_name} ${student.last_name}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(cls ? `/teacher/classes/${cls.id}` : '/teacher/classes')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← {cls ? cls.class_name : 'Classes'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              {cls && <p className="text-sm text-gray-500 mt-0.5">{cls.class_name}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {student.sen_flag && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">SEN</span>}
                {student.pupil_premium_flag && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">Pupil Premium</span>}
                {student.eal_flag && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">EAL</span>}
              </div>
            </div>
            <button
              onClick={() => navigate(`/teacher/classes/${student.class_id}`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Back to Class
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
              <p className="text-sm text-gray-800 mt-0.5 break-all">{student.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Candidate No.</p>
              <p className="text-sm text-gray-800 mt-0.5">{student.candidate_number || student.student_code || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Assessments</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{stats.total_submissions}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Average Score</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {stats.average_score !== null ? `${stats.average_score}%` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Submissions */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Assessment History</h2>
          </div>
          {submissions.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">No submissions yet.</p>
          ) : (
            <div className="divide-y">
              {submissions.map(sub => {
                const isEnhanced = sub.answers?.length > 0 || (sub.assessment_mode && sub.assessment_mode !== 'CLASSIC');
                const detailPath = isEnhanced
                  ? `/teacher/submissions/${sub.attempt_id}/enhanced`
                  : `/teacher/submissions/${sub.attempt_id}`;
                const score = sub.totalScore ?? sub.score;
                const total = sub.totalMarks;
                const pct = sub.percentage ?? (score != null && total > 0 ? Math.round((score / total) * 100) : null);
                const submittedAt = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                const statusColors = {
                  marked: 'bg-green-100 text-green-700',
                  submitted: 'bg-blue-100 text-blue-700',
                  in_progress: 'bg-yellow-100 text-yellow-700',
                };

                return (
                  <div key={sub.attempt_id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sub.assessment_title || `Assessment ${sub.assessment_id?.slice(0, 8) || ''}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{submittedAt}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {pct !== null && (
                        <span className="text-sm font-semibold text-gray-700">{pct}%</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                        {sub.status?.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => navigate(detailPath)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDetailPage;
