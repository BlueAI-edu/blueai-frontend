import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

// Color constants shared across analytics panels
const COLORS = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  gray: '#6b7280'
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const getStatusColor = (percentage) => {
  if (percentage >= 70) return COLORS.green;
  if (percentage >= 50) return COLORS.amber;
  return COLORS.red;
};

// "12 Oct": the day the class sat it (#408 item 9)
const shortDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const assessmentLabel = (a, idx) => {
  const name = a.title || a.subject || `Assessment ${idx + 1}`;
  const date = shortDate(a.sat_on || a.date);
  return date ? `${name} (${date})` : name;
};

// Panel A: Student Performance Trends
const StudentPerformancePanel = ({ students, heatmapData, onStudentClick }) => {
  // One line per student (only their own points are joined); x-axis is the
  // date sat, in order. Only shown once there are 2+ assessments (#408 item 9).
  const trendData = useMemo(() => heatmapData?.assessments?.map((assessment, idx) => {
    const dataPoint = { name: `${shortDate(assessment.sat_on || assessment.date)} ${(assessment.title || assessment.subject || '').substring(0, 12)}`.trim() || `A${idx + 1}` };
    heatmapData.heatmap?.forEach(student => {
      if (student.scores[idx]?.percentage !== null) {
        dataPoint[student.student] = student.scores[idx].percentage;
      }
    });
    return dataPoint;
  }) || [], [heatmapData]);

  // Bar chart: Average by student
  const studentAverages = useMemo(() => students?.map(s => ({
    name: s.student_name?.length > 15 ? s.student_name.substring(0, 15) + '...' : s.student_name,
    fullName: s.student_name,
    average: s.average || 0,
    fill: getStatusColor(s.average || 0)
  })) || [], [students]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="student-performance-title">
        Student Performance Trends
      </h3>

      {/* Line Chart: Trends over time */}
      {trendData.length > 1 && (
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-700 mb-1">Performance Over Time</h4>
          <p className="text-xs text-gray-500 mb-3">One line per student (first five shown), by the date each assessment was sat.</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {heatmapData.students?.slice(0, 5).map((student, idx) => (
                <Line
                  key={student}
                  type="monotone"
                  dataKey={student}
                  stroke={PIE_COLORS[idx % PIE_COLORS.length]}
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bar Chart: Student Averages */}
      {studentAverages.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Average Score by Student</h4>
          <ResponsiveContainer width="100%" height={Math.max(200, studentAverages.length * 28 + 40)}>
            <BarChart data={studentAverages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              {/* interval 0: label every bar (alternate bars were unlabelled) */}
              <YAxis type="category" dataKey="name" width={130} interval={0} tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload[0]) {
                    return (
                      <div className="bg-white p-2 border rounded shadow">
                        <p className="font-medium">{payload[0].payload.fullName}</p>
                        <p>Average: {payload[0].value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="average" fill={COLORS.blue}>
                {studentAverages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Heatmap Table */}
      {heatmapData?.heatmap?.length > 0 && (
        <div className="overflow-x-auto">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Performance Heatmap</h4>
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-3 py-2 bg-gray-50 text-left sticky left-0">Student</th>
                {heatmapData.assessments?.map((a, idx) => (
                  <th
                    key={idx}
                    className="border px-2 py-2 bg-gray-50 text-center text-xs min-w-[90px] max-w-[120px] align-bottom"
                    title={assessmentLabel(a, idx)}
                  >
                    <span className="block truncate font-medium">{a.title || a.subject || `Assessment ${idx + 1}`}</span>
                    <span className="block text-gray-500 font-normal">{shortDate(a.sat_on || a.date)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.heatmap.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onStudentClick(row.student)}
                >
                  <td className="border px-3 py-2 font-medium sticky left-0 bg-white">
                    {row.student}
                  </td>
                  {row.scores.map((score, sIdx) => (
                    <td
                      key={sIdx}
                      className={`border px-3 py-2 text-center text-sm font-medium ${
                        score.status === 'green' ? 'bg-green-100 text-green-800' :
                        score.status === 'amber' ? 'bg-amber-100 text-amber-800' :
                        score.status === 'red' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {score.percentage !== null ? `${score.percentage}%` : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-100 border"></span> ≥70%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-amber-100 border"></span> 50-69%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-red-100 border"></span> &lt;50%
            </span>
          </div>
        </div>
      )}

      {!students?.length && (
        <div className="text-center py-8 text-gray-500">
          No data yet. Students appear here once a submission has been marked.
        </div>
      )}
    </div>
  );
};

export default StudentPerformancePanel;
