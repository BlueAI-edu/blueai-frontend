import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/config';
import { handleApiError } from '@/lib/handle-error';
import { useAsync } from '@/hooks/use-async';

const ClassAnalyticsTab = ({ classId, className }) => {
  const [analytics, setAnalytics] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [runExportCSV, exportingCSV] = useAsync();
  const [runExportPDF, exportingPDF] = useAsync();
  const [activeView, setActiveView] = useState('overview'); // overview, heatmap

  useEffect(() => {
    loadAnalytics();
  }, [classId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, heatmapRes] = await Promise.all([
        axios.get(`${API}/teacher/classes/${classId}/analytics`),
        axios.get(`${API}/teacher/classes/${classId}/analytics/heatmap`)
      ]);
      setAnalytics(analyticsRes.data);
      setHeatmap(heatmapRes.data);
    } catch (error) {
      setError('Failed to load analytics');
    }
    setLoading(false);
  };

  const handleExportCSV = () => runExportCSV(async () => {
    const response = await axios.get(`${API}/teacher/classes/${classId}/analytics/export-csv`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Class_Analytics_${className.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, (error) => handleApiError(error, 'Failed to export CSV'));

  const handleExportPDF = () => runExportPDF(async () => {
    const response = await axios.get(`${API}/teacher/classes/${classId}/analytics/export-pdf`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Class_Analytics_${className.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, (error) => handleApiError(error, 'Failed to export PDF'));

  // Helper function to get color based on percentage
  const getScoreColor = (percentage) => {
    if (percentage === null) return 'bg-gray-100';
    if (percentage >= 70) return 'bg-green-500 text-white';
    if (percentage >= 50) return 'bg-yellow-400 text-gray-900';
    if (percentage >= 30) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getScoreBgStyle = (percentage) => {
    if (percentage === null) return { backgroundColor: '#f3f4f6' };
    if (percentage >= 70) return { backgroundColor: '#22c55e' };
    if (percentage >= 50) return { backgroundColor: '#facc15' };
    if (percentage >= 30) return { backgroundColor: '#f97316' };
    return { backgroundColor: '#ef4444' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-red-600">{error || 'Failed to load analytics'}</p>
        <button onClick={loadAnalytics} className="mt-4 text-blue-600 hover:underline">Retry</button>
      </div>
    );
  }

  const { summary, students, topics_to_reteach, assessments } = analytics;

  return (
    <div className="space-y-6">
      {/* View Toggle and Export Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="overview-tab"
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('heatmap')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'heatmap'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="heatmap-tab"
          >
            Performance Heatmap
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            data-testid="export-csv-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportingCSV ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            data-testid="export-pdf-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {exportingPDF ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Heatmap View */}
      {activeView === 'heatmap' && heatmap && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Performance Heatmap
            </h3>
            <p className="text-sm text-gray-600 mt-1">Students × Assessments - hover for details</p>
          </div>

          {/* Color Legend */}
          <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-4 text-xs">
            <span className="text-gray-600">Score Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>70%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-400"></div>
              <span>50-69%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span>30-49%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>&lt;30%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-200"></div>
              <span>No data</span>
            </div>
          </div>

          {heatmap.matrix?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                      Student
                    </th>
                    {heatmap.assessments?.map((a, idx) => (
                      <th
                        key={idx}
                        className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[80px]"
                        title={`${a.subject} - ${a.topic || 'N/A'}`}
                      >
                        <div className="truncate max-w-[80px]">{a.subject}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{a.join_code}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50 sticky right-0 z-10">
                      Avg
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {heatmap.matrix.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {row.preferred_name || row.student_name}
                          </span>
                          {row.sen_flag && (
                            <span className="px-1 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded">SEN</span>
                          )}
                          {row.pupil_premium_flag && (
                            <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">PP</span>
                          )}
                        </div>
                      </td>
                      {row.scores?.map((score, scoreIdx) => (
                        <td
                          key={scoreIdx}
                          className="px-1 py-1 text-center"
                          title={score.percentage !== null
                            ? `${score.score}/${score.max_marks} (${score.percentage}%)`
                            : 'No submission'
                          }
                        >
                          <div
                            className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium cursor-default transition-transform hover:scale-105 ${getScoreColor(score.percentage)}`}
                          >
                            {score.percentage !== null ? `${Math.round(score.percentage)}%` : '-'}
                          </div>
                        </td>
                      ))}
                      <td className="px-2 py-1 text-center sticky right-0 bg-blue-50 z-10">
                        <span className={`text-sm font-bold ${
                          row.average === null ? 'text-gray-400' :
                          row.average >= 70 ? 'text-green-600' :
                          row.average >= 50 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {row.average !== null ? `${row.average}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No assessment data available for heatmap.</p>
              <p className="text-sm mt-2">Link assessments to this class to see performance data.</p>
            </div>
          )}
        </div>
      )}

      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{summary.class_average || 0}%</p>
              <p className="text-sm text-gray-600">Class Average</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{summary.improving_count}</p>
              <p className="text-sm text-gray-600">Improving</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{summary.students_needing_support}</p>
              <p className="text-sm text-gray-600">Need Support</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{summary.declining_count}</p>
              <p className="text-sm text-gray-600">Declining</p>
            </div>
          </div>

          {/* Students Needing Support */}
          {students.needing_support.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Students Needing Support ({students.needing_support.length})
          </h3>
          <div className="space-y-3">
            {students.needing_support.map((student, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{student.student_name}</p>
                  <p className="text-sm text-red-600">{student.support_reasons.join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{student.average_score || 0}%</p>
                  <p className="text-xs text-gray-500">{student.marked_attempts} assessments</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics to Reteach */}
      {topics_to_reteach.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Topics to Reteach ({topics_to_reteach.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics_to_reteach.map((topic, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900">{topic.topic}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    topic.average_percentage < 40 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {topic.average_percentage}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">{topic.attempts} attempts</p>
                {topic.struggling_students.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Struggling: {topic.struggling_students.slice(0, 3).join(', ')}
                    {topic.struggling_students.length > 3 && ` +${topic.struggling_students.length - 3} more`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Students Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">All Students Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assessments</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Average</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.all.map((student, idx) => (
                <tr key={idx} className={student.needs_support ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{student.student_name}</p>
                      <div className="flex gap-1 mt-1">
                        {student.sen_flag && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">SEN</span>}
                        {student.pupil_premium_flag && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">PP</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{student.marked_attempts}</td>
                  <td className="px-4 py-3 text-center">
                    {student.average_score !== null ? (
                      <span className={`font-medium ${
                        student.average_score >= 70 ? 'text-green-600' :
                        student.average_score >= 50 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {student.average_score}%
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {student.trend === 'improving' && (
                      <span className="text-green-600 flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Improving
                      </span>
                    )}
                    {student.trend === 'declining' && (
                      <span className="text-red-600 flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Declining
                      </span>
                    )}
                    {student.trend === 'stable' && <span className="text-gray-500">Stable</span>}
                    {student.trend === 'no_data' && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {student.needs_support ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Needs Support</span>
                    ) : student.marked_attempts > 0 ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">On Track</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">No Data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Assessments */}
      {assessments.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Recent Assessments</h3>
          </div>
          <div className="divide-y">
            {assessments.slice(0, 5).map((assessment, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{assessment.subject}</p>
                  {assessment.topic && <p className="text-sm text-gray-500">{assessment.topic}</p>}
                  <p className="text-xs text-gray-400">{assessment.marked_count}/{assessment.total_submissions} marked</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    assessment.average_score >= 70 ? 'text-green-600' :
                    assessment.average_score >= 50 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {assessment.average_score}%
                  </p>
                  <p className="text-xs text-gray-500">avg score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default ClassAnalyticsTab;
