import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Color constants
const COLORS = {
  blue: '#3b82f6',
};

const getStatusClass = (percentage) => {
  if (percentage >= 70) return 'bg-green-100 text-green-800';
  if (percentage >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
};

// Student Profile Modal
const StudentProfileModal = ({ student, onClose, onExportPDF }) => {
  if (!student) return null;

  // Prepare chart data
  const trendData = student.recent_scores?.map((s, idx) => ({
    name: `Test ${student.recent_scores.length - idx}`,
    percentage: s.percentage,
    date: new Date(s.date).toLocaleDateString()
  })).reverse() || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{student.student_name}</h2>
            <p className="text-gray-600">Student Analytics Profile</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onExportPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{student.overall_average}%</p>
              <p className="text-sm text-blue-600">Overall Average</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{student.total_submissions}</p>
              <p className="text-sm text-gray-600">Total Submissions</p>
            </div>
            <div className={`rounded-lg p-4 text-center ${
              student.trend === 'improving' ? 'bg-green-50' :
              student.trend === 'declining' ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <p className={`text-2xl font-bold capitalize ${
                student.trend === 'improving' ? 'text-green-700' :
                student.trend === 'declining' ? 'text-red-700' : 'text-gray-700'
              }`}>
                {student.trend === 'improving' ? '↑' : student.trend === 'declining' ? '↓' : '→'} {student.trend}
              </p>
              <p className="text-sm text-gray-600">Trend</p>
            </div>
            <div className={`rounded-lg p-4 text-center ${student.needs_support ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className={`text-2xl font-bold ${student.needs_support ? 'text-red-700' : 'text-green-700'}`}>
                {student.needs_support ? '⚠️ Yes' : '✓ No'}
              </p>
              <p className="text-sm text-gray-600">Needs Support</p>
            </div>
          </div>

          {/* Support Reasons */}
          {student.needs_support && student.support_reasons?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-800 mb-2">Support Needed:</h4>
              <ul className="list-disc list-inside text-red-700">
                {student.support_reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Trend Graph */}
          {trendData.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Performance Trend</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={({ payload }) => {
                    if (payload && payload[0]) {
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p>{payload[0].payload.date}</p>
                          <p className="font-bold">{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Area type="monotone" dataKey="percentage" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weak Topics */}
          {student.weak_topics?.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Weak Topics</h4>
              <div className="flex flex-wrap gap-2">
                {student.weak_topics.map((topic, idx) => (
                  <span key={idx} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                    {topic.topic}: {topic.average}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submissions Table */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">All Submissions</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-3 py-2 text-left">Subject</th>
                    <th className="border px-3 py-2 text-center">Score</th>
                    <th className="border px-3 py-2 text-center">Percentage</th>
                    <th className="border px-3 py-2 text-center">Status</th>
                    <th className="border px-3 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {student.submissions?.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{sub.subject}</td>
                      <td className="border px-3 py-2 text-center">
                        {sub.status === 'marked' ? `${sub.score}/${sub.max_marks}` : '-'}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {sub.status === 'marked' && (
                          <span className={`px-2 py-1 rounded text-sm ${getStatusClass(sub.percentage)}`}>
                            {sub.percentage}%
                          </span>
                        )}
                      </td>
                      <td className="border px-3 py-2 text-center capitalize">{sub.status}</td>
                      <td className="border px-3 py-2 text-sm text-gray-600">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
