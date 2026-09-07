import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Navbar } from '../components/Navbar';
import { API } from '@/config';

// ------------------------------------------------------------------ //
// Helpers
// ------------------------------------------------------------------ //

const pctColor = (pct) => {
  if (pct == null) return 'text-gray-400';
  if (pct >= 70) return 'text-green-600';
  if (pct >= 50) return 'text-amber-500';
  return 'text-red-500';
};

const statusBadge = (status) => {
  const map = {
    'on-track': 'bg-green-100 text-green-700',
    'watch': 'bg-amber-100 text-amber-700',
    'struggling': 'bg-red-100 text-red-600',
    'no-data': 'bg-gray-100 text-gray-500',
  };
  const labels = {
    'on-track': 'On track',
    'watch': 'Watch',
    'struggling': 'Struggling',
    'no-data': 'No data',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  );
};

const difficultyBadge = (index) => {
  if (index == null) return <span className="text-gray-400 text-xs">–</span>;
  if (index >= 0.7) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Hard</span>;
  if (index >= 0.4) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Medium</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Easy</span>;
};

const actionIcon = (type) => {
  if (type === 'intervention') return '🚨';
  if (type === 'review') return '🔍';
  if (type === 'reteach') return '📚';
  if (type === 'praise') return '🌟';
  return '📌';
};

const actionBorder = (priority) => {
  if (priority === 1) return 'border-red-300 bg-red-50';
  if (priority === 2) return 'border-amber-300 bg-amber-50';
  return 'border-green-300 bg-green-50';
};

const TABS = ['Overview', 'Questions', 'Students', 'Topics', 'Errors', 'Actions', 'Misconceptions'];

// ------------------------------------------------------------------ //
// Main page
// ------------------------------------------------------------------ //

export const AssessmentAnalyticsPage = ({ user }) => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [sortQ, setSortQ] = useState({ field: 'difficultyIndex', dir: 'desc' });
  const [sortS, setSortS] = useState({ field: 'pct', dir: 'desc' });
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => {
    axios
      .get(`${API}/teacher/analytics/assessment/${assessmentId}/full`)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load analytics');
        setLoading(false);
      });
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 font-medium mb-3">{error}</p>
            <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">← Back</button>
          </div>
        </div>
      </div>
    );
  }

  const { assessment, overview, questions, students, topics, errors, actions } = data;
  const noData = overview.markedCount === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <Link
            to={`/teacher/assessments/${assessmentId}/enhanced`}
            className="text-sm text-blue-600 hover:underline mb-2 inline-block"
          >
            ← Back to assessment
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {assessment.subject} · {assessment.totalMarks} marks · {overview.markedCount} submission{overview.markedCount !== 1 ? 's' : ''} marked
            {overview.inProgressCount > 0 && (
              <span className="ml-2 text-amber-600">({overview.inProgressCount} still in progress)</span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {TABS.map((tab) => {
            const badge = tab === 'Actions' ? actions.length
              : tab === 'Questions' ? questions.length
              : tab === 'Students' ? students.length
              : null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {badge != null && badge > 0 && (
                  <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {noData && (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-dashed border-gray-200">
            <p className="text-lg font-medium mb-1">No marked submissions yet</p>
            <p className="text-sm">Analytics will appear once students have been marked.</p>
          </div>
        )}

        {!noData && (
          <>
            {activeTab === 'Overview' && (
              <OverviewTab overview={overview} />
            )}
            {activeTab === 'Questions' && (
              <QuestionsTab
                questions={questions}
                sort={sortQ}
                setSort={setSortQ}
              />
            )}
            {activeTab === 'Students' && (
              <StudentsTab
                students={students}
                assessmentId={assessmentId}
                filter={studentFilter}
                setFilter={setStudentFilter}
                sort={sortS}
                setSort={setSortS}
              />
            )}
            {activeTab === 'Topics' && <TopicsTab topics={topics} />}
            {activeTab === 'Errors' && <ErrorsTab errors={errors} />}
            {activeTab === 'Actions' && <ActionsTab actions={actions} />}
            {activeTab === 'Misconceptions' && <MisconceptionsTab assessmentId={assessmentId} />}
          </>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ //
// Tab: Overview
// ------------------------------------------------------------------ //

const KpiCard = ({ label, value, sub, color = 'text-blue-600' }) => (
  <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value ?? '–'}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const OverviewTab = ({ overview }) => {
  const {
    markedCount, avgPct, medianPct, passRate, reviewFlagCount, distribution,
  } = overview;

  const distData = distribution.map((d) => ({ ...d, fill: d.range.startsWith('9') || d.range.startsWith('8') ? '#22c55e' : d.range.startsWith('4') || d.range.startsWith('3') || d.range.startsWith('2') || d.range.startsWith('1') || d.range.startsWith('0') ? '#ef4444' : '#f59e0b' }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Submissions Marked" value={markedCount} />
        <KpiCard
          label="Class Average"
          value={avgPct != null ? `${avgPct}%` : null}
          color={pctColor(avgPct)}
        />
        <KpiCard
          label="Median Score"
          value={medianPct != null ? `${medianPct}%` : null}
          color={pctColor(medianPct)}
        />
        <KpiCard
          label="Pass Rate (≥60%)"
          value={passRate != null ? `${passRate}%` : null}
          color={passRate != null && passRate >= 60 ? 'text-green-600' : 'text-red-500'}
        />
        <KpiCard
          label="Flagged for Review"
          value={reviewFlagCount}
          color={reviewFlagCount > 0 ? 'text-amber-500' : 'text-gray-400'}
          sub={reviewFlagCount > 0 ? 'Needs teacher check' : 'None flagged'}
        />
      </div>

      {distribution.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {distData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ //
// Tab: Questions
// ------------------------------------------------------------------ //

const SortButton = ({ field, current, setSort }) => {
  const active = current.field === field;
  return (
    <button
      onClick={() => setSort(s =>
        s.field === field
          ? { field, dir: s.dir === 'desc' ? 'asc' : 'desc' }
          : { field, dir: 'desc' }
      )}
      className={`ml-1 text-xs ${active ? 'text-blue-600' : 'text-gray-400'}`}
    >
      {active && current.dir === 'asc' ? '▲' : '▼'}
    </button>
  );
};

const QuestionsTab = ({ questions, sort, setSort }) => {
  const sorted = [...questions].sort((a, b) => {
    const av = a[sort.field] ?? -1;
    const bv = b[sort.field] ?? -1;
    return sort.dir === 'desc' ? bv - av : av - bv;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Q</th>
            <th className="px-4 py-3 text-left">Preview</th>
            <th className="px-4 py-3 text-left">Topic</th>
            <th className="px-4 py-3 text-center">
              Marks
              <SortButton field="marks" current={sort} setSort={setSort} />
            </th>
            <th className="px-4 py-3 text-center">
              Avg %
              <SortButton field="avgPct" current={sort} setSort={setSort} />
            </th>
            <th className="px-4 py-3 text-center">
              Full marks
              <SortButton field="fullMarkRate" current={sort} setSort={setSort} />
            </th>
            <th className="px-4 py-3 text-center">
              Zero
              <SortButton field="zeroMarkRate" current={sort} setSort={setSort} />
            </th>
            <th className="px-4 py-3 text-center">
              Difficulty
              <SortButton field="difficultyIndex" current={sort} setSort={setSort} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((q) => (
            <QuestionRow key={q.questionNumber} q={q} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const QuestionRow = ({ q }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-4 py-3 font-semibold text-gray-700">Q{q.questionNumber}</td>
        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{q.questionBody || '—'}</td>
        <td className="px-4 py-3 text-gray-500">{q.topic || '—'}</td>
        <td className="px-4 py-3 text-center text-gray-700">{q.marks}</td>
        <td className={`px-4 py-3 text-center font-semibold ${pctColor(q.avgPct)}`}>
          {q.avgPct != null ? `${q.avgPct}%` : '–'}
        </td>
        <td className="px-4 py-3 text-center text-gray-600">
          {q.fullMarkRate != null ? `${Math.round(q.fullMarkRate * 100)}%` : '–'}
        </td>
        <td className="px-4 py-3 text-center text-gray-600">
          {q.zeroMarkRate != null ? `${Math.round(q.zeroMarkRate * 100)}%` : '–'}
        </td>
        <td className="px-4 py-3 text-center">{difficultyBadge(q.difficultyIndex)}</td>
      </tr>
      {open && q.topMissedPoints?.length > 0 && (
        <tr>
          <td colSpan={8} className="bg-red-50 px-6 py-3">
            <p className="text-xs font-semibold text-red-700 mb-2">Top missed mark points:</p>
            <ul className="space-y-1">
              {q.topMissedPoints.map((mp, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-[10px] font-bold">
                    {mp.missedCount}
                  </span>
                  <span>{mp.point}</span>
                  <span className="text-gray-400">({mp.missedCount}/{mp.totalCount} missed)</span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
      {open && (!q.topMissedPoints || q.topMissedPoints.length === 0) && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-6 py-2 text-xs text-gray-400">
            No missed mark point data available for this question.
          </td>
        </tr>
      )}
    </>
  );
};

// ------------------------------------------------------------------ //
// Tab: Students
// ------------------------------------------------------------------ //

const StudentsTab = ({ students, assessmentId, filter, setFilter, sort, setSort }) => {
  const filtered = students.filter((s) =>
    !filter || s.studentName.toLowerCase().includes(filter.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sort.field] ?? -1;
    const bv = b[sort.field] ?? -1;
    return sort.dir === 'desc' ? bv - av : av - bv;
  });

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Filter by name…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-center">
                Score %
                <SortButton field="pct" current={sort} setSort={setSort} />
              </th>
              <th className="px-4 py-3 text-center">Strongest Q</th>
              <th className="px-4 py-3 text-center">Weakest Q</th>
              <th className="px-4 py-3 text-center">Review</th>
              <th className="px-4 py-3 text-center">Submission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((s, i) => (
              <tr key={s.attemptId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{s.studentName}</td>
                <td className={`px-4 py-3 text-center font-semibold ${pctColor(s.pct)}`}>
                  {s.pct != null ? `${s.pct}%` : '–'}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {s.strongestQuestion != null ? `Q${s.strongestQuestion}` : '–'}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {s.weakestQuestion != null ? `Q${s.weakestQuestion}` : '–'}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.needsReview ? (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Review</span>
                  ) : (
                    <span className="text-xs text-gray-300">–</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <a
                    href={`/teacher/submissions/${s.attemptId}/enhanced`}
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ //
// Tab: Topics
// ------------------------------------------------------------------ //

const TopicsTab = ({ topics }) => {
  if (!topics.length) {
    return <p className="text-sm text-gray-400">No topic data — add topics to your questions in the assessment builder.</p>;
  }

  const chartData = topics
    .filter((t) => t.avgPct != null)
    .map((t) => ({
      topic: t.topic.length > 20 ? t.topic.slice(0, 18) + '…' : t.topic,
      avgPct: t.avgPct,
      fullTopic: t.topic,
    }));

  return (
    <div className="space-y-6">
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Average % by Topic</h3>
          <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 36)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="topic" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v) => `${v}%`} labelFormatter={(l, pl) => pl?.[0]?.payload?.fullTopic || l} />
              <Bar dataKey="avgPct" radius={[0, 3, 3, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.avgPct >= 70 ? '#22c55e' : entry.avgPct >= 50 ? '#f59e0b' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Topic</th>
              <th className="px-4 py-3 text-center">Questions</th>
              <th className="px-4 py-3 text-center">Class Avg %</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {topics.map((t) => (
              <tr key={t.topic} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{t.topic}</td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {t.questionNumbers.map((q) => `Q${q}`).join(', ')}
                </td>
                <td className={`px-4 py-3 text-center font-semibold ${pctColor(t.avgPct)}`}>
                  {t.avgPct != null ? `${t.avgPct}%` : '–'}
                </td>
                <td className="px-4 py-3 text-center">{statusBadge(t.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ //
// Tab: Errors
// ------------------------------------------------------------------ //

const ErrorsTab = ({ errors }) => {
  const { missedPoints, errorCategories } = errors;

  return (
    <div className="space-y-6">
      {errorCategories.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Error Category Signals</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={errorCategories} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">Counts are based on feedback text pattern matching — use as directional signals, not exact classifications.</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Most Missed Mark Points</h3>
          <p className="text-xs text-gray-400 mt-0.5">Points from the mark scheme that students failed to earn most often.</p>
        </div>
        {missedPoints.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">No mark breakdown data available.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Mark Point</th>
                <th className="px-4 py-3 text-center">Q</th>
                <th className="px-4 py-3 text-left">Topic</th>
                <th className="px-4 py-3 text-center">Missed</th>
                <th className="px-4 py-3 text-center">Missed %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {missedPoints.map((mp, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{mp.point}</td>
                  <td className="px-4 py-3 text-center text-gray-500">Q{mp.question}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{mp.topic}</td>
                  <td className="px-4 py-3 text-center font-semibold text-red-500">
                    {mp.missedCount}/{mp.totalCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold ${mp.missedPct >= 70 ? 'text-red-500' : mp.missedPct >= 40 ? 'text-amber-500' : 'text-gray-500'}`}>
                      {mp.missedPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ //
// Tab: Misconceptions (#279)
// ------------------------------------------------------------------ //

/**
 * BlueAI surfaces and suggests; the teacher stays fully in control. This
 * tab never runs anything automatically — "Analyse Misconceptions" is a
 * deliberate teacher click, and every detected instance sits as
 * "unconfirmed" until the teacher confirms, corrects, or dismisses it.
 * Aggregated rows (one per canonical_tag, grouping the same misconception
 * across students) expand to the individual per-student instances, since
 * moderation acts on one instance at a time.
 */
const MisconceptionsTab = ({ assessmentId }) => {
  const [misconceptions, setMisconceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [runStatus, setRunStatus] = useState(null);
  const [expandedTag, setExpandedTag] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const pollRef = useRef(null);

  const load = () => {
    axios
      .get(`${API}/teacher/assessments/${assessmentId}/misconceptions`)
      .then((res) => setMisconceptions(res.data.misconceptions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [assessmentId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setRunStatus('running');
    try {
      const res = await axios.post(`${API}/teacher/assessments/${assessmentId}/misconceptions/analyze`);
      const runId = res.data.run_id;
      pollRef.current = setInterval(async () => {
        try {
          const runRes = await axios.get(
            `${API}/teacher/assessments/${assessmentId}/misconceptions/runs/${runId}`
          );
          if (runRes.data.status !== 'running') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setRunStatus(runRes.data.status);
            setAnalyzing(false);
            load();
          }
        } catch {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setAnalyzing(false);
        }
      }, 3000);
    } catch {
      setAnalyzing(false);
      setRunStatus('error');
    }
  };

  const handleAction = async (instanceId, action, payload) => {
    if (action === 'confirm') {
      await axios.post(`${API}/misconceptions/${instanceId}/confirm`);
    } else if (action === 'dismiss') {
      await axios.post(`${API}/misconceptions/${instanceId}/dismiss`);
    } else if (action === 'correct') {
      await axios.put(`${API}/misconceptions/${instanceId}`, payload);
      setEditingId(null);
    }
    load();
  };

  if (loading) {
    return <p className="text-sm text-gray-400 px-1">Loading misconceptions…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Misconception Analysis</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            AI reviews missed mark points across marked submissions and suggests where understanding may be
            breaking down. Nothing here is confirmed automatically — review each and confirm, correct, or dismiss.
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
        >
          {analyzing ? 'Analysing…' : 'Analyse Misconceptions'}
        </button>
      </div>

      {runStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          Analysis failed — please try again.
        </div>
      )}

      {misconceptions.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-dashed border-gray-200">
          <p className="text-sm">No misconceptions identified yet — click "Analyse Misconceptions" above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {misconceptions.map((m) => (
            <div key={m.canonical_tag} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedTag(expandedTag === m.canonical_tag ? null : m.canonical_tag)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{m.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {m.topic}{m.subtopic ? ` · ${m.subtopic}` : ''} · affects {m.affected_student_count} student{m.affected_student_count === 1 ? '' : 's'} ({m.occurrence_count} occurrence{m.occurrence_count === 1 ? '' : 's'})
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-3">
                  {expandedTag === m.canonical_tag ? 'Hide ▲' : 'Details ▼'}
                </span>
              </button>
              {expandedTag === m.canonical_tag && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
                  {m.suggested_intervention && (
                    <p className="text-xs text-indigo-700 bg-indigo-50 rounded px-3 py-2">
                      💡 Suggested (guidance only): {m.suggested_intervention}
                    </p>
                  )}
                  <div className="space-y-2">
                    {m.instances.map((inst) => (
                      <div key={inst.id} className="bg-white rounded border border-gray-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800">{inst.student_name}</p>
                            <p className="text-xs text-gray-400 italic truncate">"{inst.evidence}"</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              inst.status === 'confirmed' ? 'bg-green-100 text-green-700'
                                : inst.status === 'dismissed' ? 'bg-gray-100 text-gray-500'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {inst.status}
                            </span>
                            {inst.status === 'unconfirmed' && (
                              <>
                                <button
                                  onClick={() => handleAction(inst.id, 'confirm')}
                                  className="text-xs font-medium text-green-700 hover:text-green-900"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => { setEditingId(inst.id); setEditText(m.description); }}
                                  className="text-xs font-medium text-blue-700 hover:text-blue-900"
                                >
                                  Correct
                                </button>
                                <button
                                  onClick={() => handleAction(inst.id, 'dismiss')}
                                  className="text-xs font-medium text-red-600 hover:text-red-800"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {editingId === inst.id && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => handleAction(inst.id, 'correct', { description: editText })}
                              className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ //
// Tab: Actions
// ------------------------------------------------------------------ //

const ActionsTab = ({ actions }) => {
  if (!actions.length) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-dashed border-gray-200">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-medium text-gray-600">No urgent actions</p>
        <p className="text-sm mt-1">The class has performed well across all metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action, i) => (
        <div key={i} className={`rounded-lg border p-5 ${actionBorder(action.priority)}`}>
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5 shrink-0">{actionIcon(action.type)}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-800">{action.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  action.priority === 1 ? 'bg-red-100 text-red-700' :
                  action.priority === 2 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  Priority {action.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600">{action.description}</p>
              {action.targetStudents?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {action.targetStudents.slice(0, 8).map((name) => (
                    <span key={name} className="text-xs bg-white text-gray-600 border border-gray-200 rounded px-2 py-0.5">
                      {name}
                    </span>
                  ))}
                  {action.targetStudents.length > 8 && (
                    <span className="text-xs text-gray-400">+{action.targetStudents.length - 8} more</span>
                  )}
                </div>
              )}
              {action.targetQuestions?.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {action.targetQuestions.map((qn) => (
                    <span key={qn} className="text-xs bg-white text-blue-600 border border-blue-200 rounded px-2 py-0.5 font-medium">
                      Q{qn}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
