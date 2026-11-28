import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { API } from '@/config';

// Color constants
const COLORS = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  gray: '#6b7280'
};

// Panel D: Math Analytics
const MathAnalyticsPanel = ({ classes, assessments }) => {
  const [mathData, setMathData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedAssessment, setSelectedAssessment] = useState('all');

  useEffect(() => {
    loadMathAnalytics();
  }, [selectedClass, selectedAssessment]);

  const loadMathAnalytics = async () => {
    setLoading(true);
    try {
      let url = `${API}/teacher/analytics/math-performance`;
      const params = new URLSearchParams();

      if (selectedAssessment !== 'all') {
        params.append('assessment_id', selectedAssessment);
      } else if (selectedClass !== 'all') {
        params.append('class_id', selectedClass);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setMathData(response.data);
    } catch (error) {
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!mathData || !mathData.analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Math Performance Analytics</h3>
        <div className="text-center py-12 text-gray-500">
          No data yet. Maths results appear here once a maths submission has been marked.
        </div>
      </div>
    );
  }

  const { analytics, total_submissions, answers_analysed } = mathData;
  // Engine metrics (LaTeX usage, working length, equivalence checks) are no
  // longer sent to teachers (#408 item 6): they describe how answers were
  // typed, not what students know.
  const { performance_by_type, common_mistakes, recommendations } = analytics;
  const mathsAssessments = (assessments || []).filter((a) => /math/i.test(a.subject || '') && a.total_submissions > 0);

  // Human-readable labels for answer_type / questionType keys
  const TYPE_LABELS = {
    SHORT_ANSWER: 'Short Answer',
    LONG_RESPONSE: 'Long Answer',
    NUMERIC: 'Numeric',
    MULTIPLE_CHOICE: 'Multiple Choice',
    MULTI_SELECT: 'Multi-Select',
    STRUCTURED_WITH_PARTS: 'Structured',
    STRUCTURED_PART: 'Sub-Part',
    // Legacy classic answer_type keys
    maths: 'Maths (LaTeX)',
    numeric: 'Numeric',
    mixed: 'Mixed',
    text: 'Written',
  };

  // Prepare data for charts
  const performanceData = Object.entries(performance_by_type || {}).map(([type, data]) => ({
    name: TYPE_LABELS[type] || String(type).replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()),
    avgScore: parseFloat(data.avg_score.toFixed(1)),
    passRate: parseFloat(data.pass_rate.toFixed(1)),
    count: data.count
  }));



  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Maths Performance</h3>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
            <select
              className="border rounded-lg px-3 py-2"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedAssessment('all');
              }}
            >
              <option value="all">All Classes</option>
              {classes?.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name || cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Assessment</label>
            <select
              className="border rounded-lg px-3 py-2"
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
            >
              <option value="all">All Assessments</option>
              {mathsAssessments.map(assess => (
                <option key={assess.assessment_id} value={assess.assessment_id}>
                  {assess.title || assess.subject} ({assess.total_submissions} marked)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Marked submissions</p>
            <p className="text-3xl font-bold text-blue-700">{total_submissions}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Answers analysed</p>
            <p className="text-3xl font-bold text-gray-800">{answers_analysed ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Performance by Question Type */}
      {performanceData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance by Question Type</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="avgScore" fill={COLORS.blue} name="Avg Score (%)" />
              <Bar dataKey="passRate" fill={COLORS.green} name="Pass Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceData.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">{item.name}</p>
                <p className="text-xs text-gray-500">{item.count} answers</p>
                <div className="mt-2 flex justify-between text-xs">
                  <span>Avg: {item.avgScore}%</span>
                  <span>Pass: {item.passRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {common_mistakes && common_mistakes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Common Mathematical Mistakes</h4>
          <div className="space-y-3">
            {common_mistakes.map((mistake, idx) => (
              <div key={idx} className={`border-l-4 p-4 rounded ${
                mistake.severity === 'high' ? 'bg-red-50 border-red-500' :
                mistake.severity === 'medium' ? 'bg-amber-50 border-amber-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900">{mistake.pattern}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    mistake.severity === 'high' ? 'bg-red-100 text-red-700' :
                    mistake.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {mistake.severity.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Frequency: {mistake.frequency} occurrences</span>
                  <span>({mistake.percentage}% of incorrect answers)</span>
                </div>
                {mistake.recommendation && (
                  <p className="mt-2 text-sm text-gray-700 italic">💡 {mistake.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Actionable Recommendations</h4>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`border-l-4 p-4 rounded ${
                rec.priority === 'high' ? 'bg-red-50 border-red-500' :
                rec.priority === 'medium' ? 'bg-amber-50 border-amber-500' :
                'bg-green-50 border-green-500'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-gray-600">{rec.category}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mb-1"><strong>Issue:</strong> {rec.issue}</p>
                <p className="text-sm text-gray-700">✓ <strong>Action:</strong> {rec.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MathAnalyticsPanel;
