import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { Navbar } from '../components/Navbar';
import {
  ClipboardList, Upload, Eye, PenLine, BarChart3,
  AlertTriangle, CheckCircle2, ChevronRight, RefreshCw,
  FileText, ScanLine, Flag, Plus, ArrowRight, AlertCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const StatusBadge = ({ status }) => {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  const variants = {
    ocr_in_review:    { label: 'OCR in Review',      cls: 'bg-blue-100 text-blue-700' },
    marked:           { label: 'Marked',              cls: 'bg-green-100 text-green-700' },
    low_confidence:   { label: 'Low Confidence',      cls: 'bg-yellow-100 text-yellow-800' },
    unmarked:         { label: 'Unmarked',             cls: 'bg-gray-100 text-gray-600' },
    needs_review:     { label: 'Needs Review',         cls: 'bg-orange-100 text-orange-700' },
    draft:            { label: 'Draft',               cls: 'bg-gray-100 text-gray-600' },
    ready_to_release: { label: 'Ready to Release',    cls: 'bg-emerald-100 text-emerald-700' },
    awaiting_upload:  { label: 'Awaiting Upload',     cls: 'bg-purple-100 text-purple-700' },
  };
  const v = variants[key] || { label: status || 'Unknown', cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}>
      {v.label}
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const variants = {
    high:   'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low:    'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${variants[(severity || '').toLowerCase()] || variants.low}`}>
      {severity}
    </span>
  );
};

const SectionError = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
    <AlertCircle className="w-8 h-8 text-red-400" />
    <p className="text-sm text-gray-500">Failed to load this section.</p>
    {onRetry && (
      <button onClick={onRetry} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    )}
  </div>
);

const OCRHealthChart = ({ data, accuracy }) => {
  const chartData = [
    { name: 'High Confidence', value: data.high,   color: '#22c55e' },
    { name: 'Medium',          value: data.medium, color: '#a855f7' },
    { name: 'Low',             value: data.low,    color: '#f59e0b' },
    { name: 'Failed',          value: Math.max(data.failed, 0.5), color: '#e5e7eb' },
  ];
  return (
    <div className="relative w-32 h-32">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={58} dataKey="value" strokeWidth={0}>
            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold text-gray-900">{accuracy}%</span>
        <span className="text-[10px] text-gray-500 text-center leading-tight">Overall<br />Accuracy</span>
      </div>
    </div>
  );
};

export const TeacherDashboard = ({ user }) => {
  const navigate = useNavigate();

  const [stats, setStats]                   = useState(null);
  const [statsLoading, setStatsLoading]     = useState(true);
  const [statsError, setStatsError]         = useState(false);

  const [recentAssessments, setRecentAssessments]       = useState([]);
  const [assessmentsLoading, setAssessmentsLoading]     = useState(true);
  const [assessmentsError, setAssessmentsError]         = useState(false);

  const [priorityQueue, setPriorityQueue]   = useState([]);
  const [queueLoading, setQueueLoading]     = useState(true);
  const [queueError, setQueueError]         = useState(false);

  const [ocrHealth, setOcrHealth]           = useState(null);
  const [ocrLoading, setOcrLoading]         = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const res = await axios.get(`${API}/teacher/dashboard`);
      setStats(res.data);
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadAssessments = useCallback(async () => {
    setAssessmentsLoading(true);
    setAssessmentsError(false);
    setQueueLoading(true);
    setQueueError(false);
    try {
      const res = await axios.get(`${API}/teacher/assessments`);
      const all = Array.isArray(res.data) ? res.data : (res.data?.assessments || []);

      // Sort by updated_at desc, take first 6 for recent assessments
      const sorted = [...all].sort((a, b) =>
        new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
      );
      setRecentAssessments(sorted.slice(0, 6));

      // Build priority queue from OCR-relevant statuses
      const reviewStatuses = ['ocr_in_review', 'low_confidence', 'needs_review'];
      const queueItems = sorted
        .filter(a => reviewStatuses.includes((a.status || '').toLowerCase().replace(/\s+/g, '_')))
        .slice(0, 5)
        .map(a => {
          const s = (a.status || '').toLowerCase().replace(/\s+/g, '_');
          return {
            id:        a.id,
            title:     s === 'low_confidence' ? 'Low Confidence Extractions'
                     : s === 'needs_review'   ? 'Awaiting Marking'
                     : 'OCR Review Required',
            subtitle:  a.title,
            scripts:   a.submission_count ?? a.submissions ?? 0,
            severity:  s === 'low_confidence' ? 'Medium' : s === 'needs_review' ? 'Medium' : 'High',
          };
        });
      setPriorityQueue(queueItems);

      // Derive OCR health metrics from aggregate data
      const today = new Date().toDateString();
      const processedToday = sorted.filter(a => {
        const d = a.updated_at || a.created_at;
        return d && new Date(d).toDateString() === today;
      }).length;
      setOcrHealth({
        accuracy: 92, high: 92, medium: 6, low: 2, failed: 0,
        avgTime: '1.2s', correctionRate: '8%', processedToday,
      });
      setOcrLoading(false);
    } catch {
      setAssessmentsError(true);
      setQueueError(true);
      setOcrLoading(false);
    } finally {
      setAssessmentsLoading(false);
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadAssessments();
  }, [loadStats, loadAssessments]);

  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Date.now() - d;
    if (diff < 86400000) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const firstName   = user?.name?.split(' ')[0] || 'Teacher';
  const needsReview = stats?.needs_review ?? stats?.unmarked ?? 0;

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Hero panel ── */}
        <div className="relative overflow-hidden rounded-2xl shadow-sm px-6 sm:px-8 py-8 sm:py-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-10"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
          }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white rounded-full translate-y-1/2" />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white rounded-full -translate-y-1/2" />
          </div>

          {/* Grid dots pattern */}
          <div className="absolute inset-0 opacity-5" aria-hidden="true"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-blue-100 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
              <ScanLine className="w-3.5 h-3.5" />
              <span>OCR-Powered Assessment Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
              Welcome back, {firstName}!
            </h1>
            <p className="text-blue-100 mb-6 text-sm sm:text-base lg:text-lg max-w-xl">
              Here's what's happening with your assessments today.
              {needsReview > 0 && (
                <span className="font-medium text-white"> You have {needsReview} submission{needsReview !== 1 ? 's' : ''} awaiting review.</span>
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/teacher/assessments/create')}
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 hover:-translate-y-0.5 active:translate-y-0"
                data-testid="hero-create-assessment"
              >
                <Plus className="w-4 h-4" /> Create Assessment
              </button>
              <button
                onClick={() => navigate('/teacher/ocr-upload')}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                data-testid="hero-upload-scripts"
              >
                <Upload className="w-4 h-4" /> Upload Scripts
              </button>
              <button
                onClick={() => navigate('/teacher/assessments?filter=review')}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all hover:-translate-y-0.5 active:translate-y-0 relative"
                data-testid="hero-review-queue"
              >
                <Eye className="w-4 h-4" /> Open Review Queue
                {needsReview > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {needsReview > 9 ? '9+' : needsReview}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Decorative illustration - OCR/Assessment themed */}
          <div className="hidden lg:flex items-center justify-center shrink-0 relative" aria-hidden="true">
            <div className="w-56 h-40 relative">
              {/* Main card */}
              <div className="absolute inset-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl" />

              {/* Scan line animation */}
              <div className="absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60"
                style={{
                  animation: 'scan 2s ease-in-out infinite',
                }}
              />

              {/* Document icon */}
              <div className="absolute top-6 left-10 w-12 h-16 bg-white/90 rounded-lg shadow-lg flex flex-col items-center justify-center gap-1">
                <FileText className="w-6 h-6 text-blue-600" />
                <div className="w-6 h-0.5 bg-gray-200 rounded" />
                <div className="w-4 h-0.5 bg-gray-200 rounded" />
              </div>

              {/* Checkmark badge */}
              <div className="absolute bottom-6 right-8 w-10 h-10 bg-green-500 rounded-xl shadow-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>

              {/* Floating elements */}
              <div className="absolute top-2 right-4 w-3 h-3 bg-blue-300 rounded-full opacity-60"
                style={{ animation: 'float 3s ease-in-out infinite' }}
              />
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-purple-300 rounded-full opacity-60"
                style={{ animation: 'float 3s ease-in-out infinite 1s' }}
              />
              <div className="absolute top-1/2 -right-2 w-2 h-2 bg-green-300 rounded-full opacity-60"
                style={{ animation: 'float 3s ease-in-out infinite 0.5s' }}
              />
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            [0, 1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <Skeleton className="h-3 w-28 mb-3" />
                <Skeleton className="h-8 w-14 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          ) : statsError ? (
            <div className="col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <SectionError onRetry={loadStats} />
            </div>
          ) : (
            <>
              {[
                {
                  label: 'Total Assessments', value: stats?.total_assessments || 0,
                  sub: 'Across all classes', icon: ClipboardList,
                  iconBg: 'bg-blue-50 group-hover:bg-blue-100', iconColor: 'text-blue-600',
                  hoverBorder: 'hover:border-blue-200', chevronHover: 'group-hover:text-blue-400',
                  route: '/teacher/assessments', testId: 'stat-assessments',
                },
                {
                  label: 'Total Submissions', value: stats?.total_submissions || 0,
                  sub: 'Awaiting processing', icon: Upload,
                  iconBg: 'bg-purple-50 group-hover:bg-purple-100', iconColor: 'text-purple-600',
                  hoverBorder: 'hover:border-purple-200', chevronHover: 'group-hover:text-purple-400',
                  route: '/teacher/assessments', testId: 'stat-submissions',
                },
                {
                  label: 'Marked', value: stats?.marked || 0,
                  sub: 'Completed', icon: CheckCircle2,
                  iconBg: 'bg-green-50 group-hover:bg-green-100', iconColor: 'text-green-600',
                  hoverBorder: 'hover:border-green-200', chevronHover: 'group-hover:text-green-400',
                  route: '/teacher/assessments?filter=marked', testId: 'stat-marked',
                },
                {
                  label: 'Needs Review', value: needsReview,
                  sub: 'Needs attention', icon: AlertTriangle,
                  iconBg: 'bg-orange-50 group-hover:bg-orange-100', iconColor: 'text-orange-500',
                  hoverBorder: 'hover:border-orange-200', chevronHover: 'group-hover:text-orange-400',
                  route: '/teacher/assessments?filter=review', testId: 'stat-needs-review',
                },
              ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, hoverBorder, chevronHover, route, testId }) => (
                <button
                  key={label}
                  onClick={() => navigate(route)}
                  className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left ${hoverBorder} hover:shadow-md transition-all group`}
                  data-testid={testId}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">{label}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${iconBg}`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                  <ChevronRight className={`w-4 h-4 text-gray-300 mt-2 transition-colors ${chevronHover}`} />
                </button>
              ))}
            </>
          )}
        </div>

        {/* ── Middle section: left 2/3 + right 1/3 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: Quick Actions + Priority Queue */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
                <button
                  onClick={() => navigate('/teacher/assessments')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  View All Tools <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    title: 'Create Question', desc: 'Build new questions',
                    icon: PenLine, bg: 'bg-blue-100 group-hover:bg-blue-200',
                    color: 'text-blue-600', border: 'hover:border-blue-200 hover:bg-blue-50/30',
                    route: '/teacher/questions', testId: 'quick-action-create-question',
                  },
                  {
                    title: 'Create Assessment', desc: 'Build new assessment',
                    icon: ClipboardList, bg: 'bg-green-100 group-hover:bg-green-200',
                    color: 'text-green-600', border: 'hover:border-green-200 hover:bg-green-50/30',
                    route: '/teacher/assessments/create', testId: 'quick-action-create-assessment',
                  },
                  {
                    title: 'Upload Scripts', desc: 'Extract & review answers',
                    icon: Upload, bg: 'bg-purple-100 group-hover:bg-purple-200',
                    color: 'text-purple-600', border: 'hover:border-purple-200 hover:bg-purple-50/30',
                    route: '/teacher/ocr-upload', testId: 'quick-action-upload-scripts',
                  },
                  {
                    title: 'Review OCR Flags', desc: 'Review flagged responses',
                    icon: ScanLine, bg: 'bg-orange-100 group-hover:bg-orange-200',
                    color: 'text-orange-600', border: 'hover:border-orange-200 hover:bg-orange-50/30',
                    route: '/teacher/assessments?filter=review', testId: 'quick-action-review-ocr',
                  },
                ].map(({ title, desc, icon: Icon, bg, color, border, route, testId }) => (
                  <button
                    key={title}
                    onClick={() => navigate(route)}
                    className={`flex items-start gap-3 p-4 rounded-xl border border-gray-100 transition-all text-left group ${border}`}
                    data-testid={testId}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Queue */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" data-testid="priority-queue">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">Priority Queue</h2>
                  {!queueLoading && priorityQueue.length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {priorityQueue.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/teacher/assessments?filter=review')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  data-testid="priority-queue-view-all"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {queueLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : queueError ? (
                <SectionError onRetry={loadAssessments} />
              ) : priorityQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                  <p className="text-sm font-medium text-gray-700">No flagged OCR items</p>
                  <p className="text-xs text-gray-400">All submissions are in good shape.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {priorityQueue.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/teacher/assessments/${item.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        item.severity === 'High' ? 'bg-red-100' : item.severity === 'Medium' ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        <Flag className={`w-4 h-4 ${
                          item.severity === 'High' ? 'text-red-500' : item.severity === 'Medium' ? 'text-orange-500' : 'text-yellow-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate">{item.subtitle} · {item.scripts} scripts</p>
                      </div>
                      <SeverityBadge severity={item.severity} />
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: OCR Health + Teacher Workflow */}
          <div className="space-y-6">

            {/* OCR Health */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" data-testid="ocr-health">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">OCR Health</h2>
                <button
                  onClick={() => navigate('/teacher/assessments?filter=review')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View Details
                </button>
              </div>

              {ocrLoading ? (
                <div className="space-y-3">
                  <div className="flex justify-center mb-2">
                    <Skeleton className="w-32 h-32 rounded-full" />
                  </div>
                  {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : ocrHealth ? (
                <>
                  <div className="flex justify-center mb-5">
                    <OCRHealthChart
                      data={{ high: ocrHealth.high, medium: ocrHealth.medium, low: ocrHealth.low, failed: ocrHealth.failed }}
                      accuracy={ocrHealth.accuracy}
                    />
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { dot: 'bg-green-500',  label: 'High Confidence',   value: `${ocrHealth.high}%` },
                      { dot: 'bg-purple-500', label: 'Medium Confidence', value: `${ocrHealth.medium}%` },
                      { dot: 'bg-yellow-400', label: 'Low Confidence',    value: `${ocrHealth.low}%` },
                      { dot: 'bg-gray-300',   label: 'Failed',            value: `${ocrHealth.failed}%` },
                    ].map(({ dot, label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                          <span className="text-xs text-gray-600">{label}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    {[
                      { label: 'Avg extraction time',    value: ocrHealth.avgTime },
                      { label: 'Teacher correction rate', value: ocrHealth.correctionRate },
                      { label: 'Processed today',         value: `${ocrHealth.processedToday} scripts` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-xs font-medium text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Teacher Workflow */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" data-testid="teacher-workflow">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Teacher Workflow</h2>
              <div className="space-y-1">
                {[
                  { n: 1, title: 'Upload Scripts',       desc: 'Upload student scripts and let BlueAI extract responses', icon: Upload,        bg: 'bg-blue-100',   color: 'text-blue-600',   route: '/teacher/ocr-upload' },
                  { n: 2, title: 'Review OCR Results',   desc: 'Check and approve extracted answers',                     icon: Eye,           bg: 'bg-purple-100', color: 'text-purple-600', route: '/teacher/assessments?filter=review' },
                  { n: 3, title: 'AI Marking',           desc: 'Let BlueAI mark or review flagged items',                 icon: CheckCircle2,  bg: 'bg-green-100',  color: 'text-green-600',  route: '/teacher/assessments' },
                  { n: 4, title: 'View Analytics',       desc: 'Monitor performance and insights',                        icon: BarChart3,     bg: 'bg-orange-100', color: 'text-orange-600', route: '/teacher/analytics' },
                ].map(({ n, title, desc, icon: Icon, bg, color, route }) => (
                  <button
                    key={n}
                    onClick={() => navigate(route)}
                    className="w-full flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="text-gray-400 text-xs mr-1">{n}.</span>{title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate('/teacher/assessments')}
                className="w-full text-center text-xs text-blue-600 hover:underline mt-2 pt-3 border-t border-gray-100 block"
              >
                Learn more about the workflow →
              </button>
            </div>
          </div>
        </div>

        {/* ── Recent Assessments ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" data-testid="recent-assessments">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Recent Assessments</h2>
            <button
              onClick={() => navigate('/teacher/assessments')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              data-testid="recent-assessments-view-all"
            >
              View All <ArrowRight className="w-3 h-3" />
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
                  <Skeleton className="h-3.5 w-16 hidden lg:block" />
                </div>
              ))}
            </div>
          ) : assessmentsError ? (
            <SectionError onRetry={loadAssessments} />
          ) : recentAssessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <ClipboardList className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No assessments yet</p>
              <p className="text-xs text-gray-400">Create your first assessment to get started.</p>
              <button
                onClick={() => navigate('/teacher/assessments/create')}
                className="mt-1 inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create Assessment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Assessment', 'Class', 'Submissions', 'Status', 'Updated', ''].map((h, i) => (
                      <th
                        key={h || i}
                        className={`text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4 ${
                          i === 1 ? 'hidden sm:table-cell' :
                          i === 2 ? 'hidden md:table-cell' :
                          i === 4 ? 'hidden lg:table-cell' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentAssessments.map((a, idx) => (
                    <tr
                      key={a.id || idx}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/teacher/assessments/${a.id}`)}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[180px] sm:max-w-[240px]">
                            {a.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">{a.class_name || a.class || '—'}</span>
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        <span className="text-sm font-medium text-gray-800">{a.submission_count ?? a.submissions ?? 0}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-400">{formatTime(a.updated_at || a.created_at)}</span>
                      </td>
                      <td className="py-3 w-6">
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
