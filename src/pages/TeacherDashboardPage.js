import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { Navbar } from '../components/Navbar';
import UsageBanner from '../components/UsageBanner';
import {
  ClipboardList, Upload, BarChart3, AlertCircle, CheckCircle2,
  ChevronRight, RefreshCw, FileText, Flag, Plus, ArrowRight, Radio,
} from 'lucide-react';

/**
 * Teacher dashboard — deliberately lean. It answers two questions:
 * "what needs my attention right now?" (flagged submissions, live assessments)
 * and "where's my recent work?" (recent assessments). Everything shown is
 * real data; the old OCR-health chart and priority queue were removed because
 * they rendered hardcoded or impossible values.
 */

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Real assessment lifecycle statuses only (draft → published → started → closed).
const StatusBadge = ({ status }) => {
  const variants = {
    draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600' },
    published: { label: 'Published', cls: 'bg-blue-100 text-blue-700' },
    started:   { label: 'Live',      cls: 'bg-green-100 text-green-700' },
    closed:    { label: 'Closed',    cls: 'bg-slate-200 text-slate-600' },
  };
  const v = variants[(status || '').toLowerCase()] || { label: status || '—', cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}>
      {v.label}
    </span>
  );
};

const SectionError = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
    <AlertCircle className="w-8 h-8 text-red-400" />
    <p className="text-sm text-gray-500">Could not load this section.</p>
    {onRetry && (
      <button onClick={onRetry} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    )}
  </div>
);

export const TeacherDashboard = ({ user }) => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [assessmentsError, setAssessmentsError] = useState(false);

  const [reviewItems, setReviewItems] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/teacher/dashboard`);
      setStats(res.data);
    } catch {
      // Stats are supplementary; the cards fall back to derived counts.
    }
  }, []);

  const loadAssessments = useCallback(async () => {
    setAssessmentsLoading(true);
    setAssessmentsError(false);
    try {
      const res = await axios.get(`${API}/teacher/assessments`);
      const all = Array.isArray(res.data) ? res.data : (res.data?.assessments || []);
      const sorted = [...all].sort((a, b) =>
        new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
      );
      setAssessments(sorted);
    } catch {
      setAssessmentsError(true);
    } finally {
      setAssessmentsLoading(false);
    }
  }, []);

  const loadReviewQueue = useCallback(async () => {
    setReviewLoading(true);
    setReviewError(false);
    try {
      const res = await axios.get(`${API}/teacher/submissions/needs-review`);
      setReviewItems(res.data?.submissions || []);
    } catch {
      setReviewError(true);
    } finally {
      setReviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadAssessments();
    loadReviewQueue();
  }, [loadStats, loadAssessments, loadReviewQueue]);

  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Date.now() - d;
    if (diff < 86400000) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const openSubmission = (item) => {
    // Enhanced attempts carry answers/questionScores; classic ones carry answer_text.
    const enhanced = item.answers != null || item.questionScores != null;
    navigate(enhanced
      ? `/teacher/submissions/${item.attempt_id}/enhanced`
      : `/teacher/submissions/${item.attempt_id}`);
  };

  const firstName = user?.name?.split(' ')[0] || 'Teacher';
  const liveAssessments = assessments.filter(a => a.status === 'started');
  const needsReview = reviewItems.length;
  const recentAssessments = assessments.slice(0, 6);

  const statCards = [
    {
      label: 'Assessments', value: stats?.total_assessments ?? assessments.length,
      icon: ClipboardList, color: 'text-blue-600 bg-blue-50',
      onClick: () => navigate('/teacher/assessments'), testId: 'stat-assessments',
    },
    {
      label: 'Live now', value: liveAssessments.length,
      icon: Radio, color: 'text-green-600 bg-green-50',
      onClick: () => navigate('/teacher/assessments'), testId: 'stat-live',
    },
    {
      label: 'Submissions', value: stats?.total_submissions ?? '—',
      icon: Upload, color: 'text-purple-600 bg-purple-50',
      onClick: () => navigate('/teacher/assessments'), testId: 'stat-submissions',
    },
    {
      label: 'Needs review', value: needsReview,
      icon: Flag, color: 'text-orange-500 bg-orange-50',
      onClick: null, testId: 'stat-needs-review', // the queue is right below
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <UsageBanner />

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="dashboard-greeting">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {needsReview > 0
                ? `${needsReview} submission${needsReview !== 1 ? 's' : ''} flagged for your review.`
                : liveAssessments.length > 0
                  ? `${liveAssessments.length} assessment${liveAssessments.length !== 1 ? 's' : ''} live right now.`
                  : 'All caught up.'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => navigate('/teacher/assessments/create')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              data-testid="hero-create-assessment"
            >
              <Plus className="w-4 h-4" /> Create Assessment
            </button>
            <button
              onClick={() => navigate('/teacher/ocr-upload')}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors"
              data-testid="hero-upload-scripts"
            >
              <Upload className="w-4 h-4" /> Upload Scripts
            </button>
          </div>
        </div>

        {/* ── Stat row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, onClick, testId }) => {
            const Tag = onClick ? 'button' : 'div';
            return (
              <Tag
                key={label}
                onClick={onClick || undefined}
                className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left flex items-center gap-3 ${onClick ? 'hover:shadow-md transition-shadow' : ''}`}
                data-testid={testId}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 leading-none">
                    {assessmentsLoading && value === 0 ? <Skeleton className="h-6 w-8" /> : value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              </Tag>
            );
          })}
        </div>

        {/* ── Live assessments strip ── */}
        {liveAssessments.length > 0 && (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5" data-testid="live-assessments">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <h2 className="text-base font-semibold text-gray-900">Live now</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {liveAssessments.slice(0, 4).map(a => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/teacher/assessments/${a.id}`)}
                  className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-900 truncate flex-1">
                    {a.title || a.subject || 'Untitled assessment'}
                  </span>
                  {a.join_code && (
                    <span className="font-mono text-xs font-semibold text-green-700 bg-green-50 rounded px-2 py-1 tracking-widest">
                      {a.join_code}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Needs review queue ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" data-testid="priority-queue">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Needs your review</h2>
              {!reviewLoading && needsReview > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                  {needsReview}
                </span>
              )}
            </div>
          </div>

          {reviewLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviewError ? (
            <SectionError onRetry={loadReviewQueue} />
          ) : needsReview === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Nothing waiting on you</p>
                <p className="text-xs text-gray-400">Submissions the AI is unsure about will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {reviewItems.slice(0, 6).map(item => (
                <button
                  key={item.attempt_id}
                  onClick={() => openSubmission(item)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.student_name || 'Student'}
                      {item.question_subject && item.question_subject !== 'Unknown' && (
                        <span className="text-gray-400 font-normal"> · {item.question_subject}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {(item.review_reasons || []).slice(0, 2).join(' · ') || 'Flagged by AI marking'}
                    </p>
                  </div>
                  {item.score != null && (
                    <span className="text-xs font-semibold text-gray-600 shrink-0">{item.score} marks</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                </button>
              ))}
              {needsReview > 6 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  Showing 6 of {needsReview} — open an assessment to see the rest.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Recent assessments ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" data-testid="recent-assessments">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent assessments</h2>
            <button
              onClick={() => navigate('/teacher/assessments')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              data-testid="recent-assessments-view-all"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {assessmentsLoading ? (
            <div className="space-y-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : assessmentsError ? (
            <SectionError onRetry={loadAssessments} />
          ) : recentAssessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <ClipboardList className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No assessments yet</p>
              <p className="text-xs text-gray-400">Create your first assessment to start collecting student work.</p>
              <button
                onClick={() => navigate('/teacher/assessments/create')}
                className="mt-1 inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create Assessment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentAssessments.map(a => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/teacher/assessments/${a.id}`)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50/60 rounded-lg px-2 transition-colors group"
                >
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.title || a.subject || 'Untitled assessment'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {a.subject && a.title ? `${a.subject} · ` : ''}{formatTime(a.updated_at || a.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Analytics shortcut ── */}
        <button
          onClick={() => navigate('/teacher/analytics')}
          className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Class analytics</p>
            <p className="text-xs text-gray-400">Performance trends, topic gaps, and intervention signals.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
        </button>

      </div>
    </div>
  );
};
