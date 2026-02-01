import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Color constants
const COLORS = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  gray: '#6b7280'
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

// Helper function to get status color
const getStatusColor = (percentage) => {
  if (percentage >= 70) return COLORS.green;
  if (percentage >= 50) return COLORS.amber;
  return COLORS.red;
};

const getStatusClass = (percentage) => {
  if (percentage >= 70) return 'bg-green-100 text-green-800';
  if (percentage >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
};

// Panel A: Student Performance Trends
const StudentPerformancePanel = ({ students, heatmapData, onStudentClick }) => {
  const [filter, setFilter] = useState({ subject: '', dateRange: 'all' });
  
  // Prepare line chart data (student trends over time)
  const trendData = heatmapData?.assessments?.map((assessment, idx) => {
    const dataPoint = { name: assessment.subject?.substring(0, 10) || `A${idx + 1}` };
    heatmapData.heatmap?.forEach(student => {
      if (student.scores[idx]?.percentage !== null) {
        dataPoint[student.student] = student.scores[idx].percentage;
      }
    });
    return dataPoint;
  }) || [];

  // Bar chart: Average by student
  const studentAverages = students?.map(s => ({
    name: s.student_name?.length > 15 ? s.student_name.substring(0, 15) + '...' : s.student_name,
    fullName: s.student_name,
    average: s.average || 0,
    fill: getStatusColor(s.average || 0)
  })) || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="student-performance-title">
        Student Performance Trends
      </h3>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select 
          className="border rounded-lg px-3 py-2 text-sm"
          value={filter.dateRange}
          onChange={(e) => setFilter({...filter, dateRange: e.target.value})}
        >
          <option value="all">All Time</option>
          <option value="month">Last Month</option>
          <option value="week">Last Week</option>
        </select>
      </div>

      {/* Line Chart: Trends over time */}
      {trendData.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Performance Over Time</h4>
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentAverages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={120} />
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
                  <th key={idx} className="border px-3 py-2 bg-gray-50 text-center text-xs">
                    {a.subject?.substring(0, 8) || `A${idx + 1}`}
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

      {students?.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No student data available yet. Students will appear here after completing assessments.
        </div>
      )}
    </div>
  );
};

// Panel B: Assessment Insights
const AssessmentInsightsPanel = ({ assessments }) => {
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Distribution chart data
  const getDistributionData = (assessment) => {
    return assessment?.distribution || [];
  };

  // Difficulty comparison
  const difficultyData = assessments?.map(a => ({
    name: a.subject?.substring(0, 12) || 'Assessment',
    difficulty: Math.round((a.difficulty_index || 0) * 100),
    average: a.average_percentage || 0
  })) || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="assessment-insights-title">
        Assessment Insights
      </h3>

      {assessments?.length > 0 ? (
        <>
          {/* Assessment Selector */}
          <div className="mb-6">
            <select 
              className="border rounded-lg px-4 py-2 w-full max-w-md"
              value={selectedAssessment?.assessment_id || ''}
              onChange={(e) => {
                const selected = assessments.find(a => a.assessment_id === e.target.value);
                setSelectedAssessment(selected);
              }}
            >
              <option value="">Select an assessment to view details</option>
              {assessments.map(a => (
                <option key={a.assessment_id} value={a.assessment_id}>
                  {a.subject} - {a.total_submissions} submissions
                </option>
              ))}
            </select>
          </div>

          {/* Selected Assessment Details */}
          {selectedAssessment && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Average Score</p>
                <p className="text-2xl font-bold text-blue-700">{selectedAssessment.average_percentage}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Highest Score</p>
                <p className="text-2xl font-bold text-green-700">{selectedAssessment.highest_score}/{selectedAssessment.max_marks}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600">Lowest Score</p>
                <p className="text-2xl font-bold text-red-700">{selectedAssessment.lowest_score}/{selectedAssessment.max_marks}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Difficulty Index</p>
                <p className="text-2xl font-bold text-purple-700">{Math.round((selectedAssessment.difficulty_index || 0) * 100)}%</p>
              </div>
            </div>
          )}

          {/* Mark Distribution Histogram */}
          {selectedAssessment && (
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-700 mb-3">Mark Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getDistributionData(selectedAssessment)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.blue}>
                    {getDistributionData(selectedAssessment).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.range === '81-100' ? COLORS.green :
                          entry.range === '61-80' ? '#86efac' :
                          entry.range === '41-60' ? COLORS.amber :
                          entry.range === '21-40' ? '#fca5a5' :
                          COLORS.red
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Difficulty Comparison */}
          <div>
            <h4 className="text-lg font-medium text-gray-700 mb-3">Assessment Difficulty Comparison</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="difficulty" name="Difficulty %" fill={COLORS.red} />
                <Bar dataKey="average" name="Class Average %" fill={COLORS.blue} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No assessment data available yet.
        </div>
      )}
    </div>
  );
};

// Panel C: Class Support Indicators
const ClassSupportPanel = ({ overview, aiInsights, onGenerateInsights, loading }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900" data-testid="class-support-title">
          Class Support Indicators
        </h3>
        <button
          onClick={onGenerateInsights}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          data-testid="generate-insights-btn"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate AI Insights
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{overview?.total_students || 0}</p>
          <p className="text-sm text-gray-600">Total Students</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{overview?.underperforming_count || 0}</p>
          <p className="text-sm text-red-600">Underperforming</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{overview?.improving_count || 0}</p>
          <p className="text-sm text-green-600">Improving</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{overview?.declining_count || 0}</p>
          <p className="text-sm text-amber-600">Declining</p>
        </div>
      </div>

      {/* AI Summary */}
      {aiInsights?.ai_summary && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Intervention Recommendation
          </h4>
          <p className="text-purple-700" data-testid="ai-summary">{aiInsights.ai_summary}</p>
        </div>
      )}

      {/* Student Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Underperforming Students */}
        <div>
          <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            Students Needing Support
          </h4>
          {overview?.underperforming_students?.length > 0 ? (
            <ul className="space-y-2">
              {overview.underperforming_students.slice(0, 5).map((student, idx) => (
                <li key={idx} className="flex justify-between items-center bg-red-50 rounded px-3 py-2">
                  <span className="font-medium">{student.student_name}</span>
                  <span className="text-red-600 font-bold">{student.average}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No underperforming students</p>
          )}
        </div>

        {/* Declining Students */}
        <div>
          <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
            Declining Performance
          </h4>
          {overview?.declining_students?.length > 0 ? (
            <ul className="space-y-2">
              {overview.declining_students.slice(0, 5).map((student, idx) => (
                <li key={idx} className="flex justify-between items-center bg-amber-50 rounded px-3 py-2">
                  <span className="font-medium">{student.student_name}</span>
                  <span className="text-amber-600">{student.trend}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No declining students</p>
          )}
        </div>
      </div>

      {/* Topic Weakness */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-700 mb-3">Topic Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weak Topics */}
          <div>
            <p className="text-sm text-red-600 font-medium mb-2">Weak Topics (&lt;50%)</p>
            {overview?.weak_topics?.length > 0 ? (
              <ul className="space-y-1">
                {overview.weak_topics.slice(0, 5).map((topic, idx) => (
                  <li key={idx} className="flex justify-between bg-red-50 rounded px-3 py-2 text-sm">
                    <span>{topic.topic}</span>
                    <span className="text-red-600 font-medium">{topic.average_percentage}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No weak topics</p>
            )}
          </div>

          {/* Strong Topics */}
          <div>
            <p className="text-sm text-green-600 font-medium mb-2">Strong Topics (&gt;70%)</p>
            {overview?.strong_topics?.length > 0 ? (
              <ul className="space-y-1">
                {overview.strong_topics.slice(0, 5).map((topic, idx) => (
                  <li key={idx} className="flex justify-between bg-green-50 rounded px-3 py-2 text-sm">
                    <span>{topic.topic}</span>
                    <span className="text-green-600 font-medium">{topic.average_percentage}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No strong topics yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
      console.error('Error loading math analytics:', error);
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
          No math assessment data available yet. Math-specific metrics will appear here after students complete math assessments.
        </div>
      </div>
    );
  }

  const { analytics, total_submissions } = mathData;
  const { overview, performance_by_type, working_quality, common_mistakes, recommendations } = analytics;

  // Prepare data for charts
  const performanceData = Object.entries(performance_by_type || {}).map(([type, data]) => ({
    name: type === 'maths' ? 'Math' : type === 'numeric' ? 'Numeric' : type === 'mixed' ? 'Mixed' : 'Text',
    avgScore: data.avg_score.toFixed(1),
    passRate: data.pass_rate.toFixed(1),
    count: data.count
  }));

  const usageData = [
    { name: 'LaTeX Usage', value: overview.latex_usage_percentage, color: COLORS.blue },
    { name: 'Working Provided', value: overview.working_provided_percentage, color: COLORS.green },
    { name: 'Equivalence Success', value: overview.equivalence_success_rate, color: COLORS.purple }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Math Performance Analytics</h3>
        
        {/* Filters */}
        <div className="flex gap-4 mb-6">
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
                <option key={cls.id} value={cls.id}>{cls.name}</option>
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
              {assessments?.map(assess => (
                <option key={assess.assessment_id} value={assess.assessment_id}>
                  {assess.subject} ({assess.total_submissions} submissions)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-700">{total_submissions}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">LaTeX Usage</p>
            <p className="text-3xl font-bold text-green-700">{overview.latex_usage_percentage}%</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 mb-1">Working Provided</p>
            <p className="text-3xl font-bold text-purple-700">{overview.working_provided_percentage}%</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-600 mb-1">Equivalence Checked</p>
            <p className="text-3xl font-bold text-amber-700">{overview.equivalence_checked}</p>
            <p className="text-xs text-amber-600 mt-1">Success: {overview.equivalence_success_rate}%</p>
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
              <YAxis yAxisId="left" orientation="left" stroke={COLORS.blue} />
              <YAxis yAxisId="right" orientation="right" stroke={COLORS.green} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="avgScore" fill={COLORS.blue} name="Avg Score (%)" />
              <Bar yAxisId="right" dataKey="passRate" fill={COLORS.green} name="Pass Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceData.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">{item.name}</p>
                <p className="text-xs text-gray-500">{item.count} submissions</p>
                <div className="mt-2 flex justify-between text-xs">
                  <span>Avg: {item.avgScore}%</span>
                  <span>Pass: {item.passRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Student Engagement & Tool Usage</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={usageData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="name" width={150} />
            <Tooltip />
            <Bar dataKey="value" name="Percentage (%)">
              {usageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Working Quality Analysis */}
      {working_quality && working_quality.submissions_with_working > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Working Quality Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Submissions with Working</p>
              <p className="text-2xl font-bold text-gray-900">{working_quality.submissions_with_working}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Avg Working Length</p>
              <p className="text-2xl font-bold text-gray-900">{working_quality.average_length} chars</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Structured Working</p>
              <p className="text-2xl font-bold text-gray-900">{working_quality.structured_working_pct}%</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Quality Score</p>
              <p className="text-2xl font-bold text-green-700">{working_quality.quality_score}/100</p>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-sm text-blue-700">
              <strong>LaTeX in Working:</strong> {working_quality.latex_usage_in_working_pct}% of students use LaTeX notation in their working
            </p>
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

// Main Analytics Page
export const AnalyticsPage = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [studentsData, setStudentsData] = useState(null);
  const [assessmentsData, setAssessmentsData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadAnalyticsData();
    loadClasses();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [overviewRes, studentsRes, assessmentsRes] = await Promise.all([
        axios.get(`${API}/teacher/analytics/overview`),
        axios.get(`${API}/teacher/analytics/students`),
        axios.get(`${API}/teacher/analytics/assessments`)
      ]);
      
      setOverview(overviewRes.data);
      setStudentsData(studentsRes.data);
      setAssessmentsData(assessmentsRes.data.assessments);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const loadClasses = async () => {
    try {
      const response = await axios.get(`${API}/teacher/classes`);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudentProfile = async (studentName) => {
    try {
      const response = await axios.get(`${API}/teacher/analytics/student/${encodeURIComponent(studentName)}`);
      setStudentProfile(response.data);
      setSelectedStudent(studentName);
    } catch (error) {
      console.error('Error loading student profile:', error);
    }
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await axios.post(`${API}/teacher/analytics/generate-insights`);
      setAiInsights(response.data);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
    setInsightsLoading(false);
  };

  const exportCSV = async () => {
    try {
      const response = await axios.get(`${API}/teacher/analytics/export/csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'analytics_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const exportPDF = async () => {
    try {
      const response = await axios.get(`${API}/teacher/analytics/export/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'class_analytics.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const exportStudentPDF = async (studentName) => {
    try {
      const response = await axios.get(`${API}/teacher/analytics/student/${encodeURIComponent(studentName)}/export-pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${studentName}_analytics.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting student PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <div className="flex gap-4">
              <button onClick={() => navigate('/teacher/dashboard')} className="text-gray-700 hover:text-blue-600">Dashboard</button>
              <button onClick={() => navigate('/teacher/questions')} className="text-gray-700 hover:text-blue-600">Questions</button>
              <button onClick={() => navigate('/teacher/assessments')} className="text-gray-700 hover:text-blue-600">Assessments</button>
              <button className="text-blue-600 font-medium">Analytics</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user.name}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="analytics-title">Analytics Dashboard</h2>
            <p className="text-gray-600">Track student performance, identify trends, and get AI-powered insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              data-testid="export-csv-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              data-testid="export-pdf-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'students' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Student Performance
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'assessments' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Assessment Insights
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'math' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Math Analytics
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'support' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Class Support
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'students' && (
          <StudentPerformancePanel 
            students={studentsData?.students || []}
            heatmapData={studentsData?.heatmap}
            onStudentClick={loadStudentProfile}
          />
        )}

        {activeTab === 'assessments' && (
          <AssessmentInsightsPanel assessments={assessmentsData} />
        )}

        {activeTab === 'math' && (
          <MathAnalyticsPanel 
            classes={classes}
            assessments={assessmentsData}
          />
        )}

        {activeTab === 'support' && (
          <ClassSupportPanel 
            overview={overview}
            aiInsights={aiInsights}
            onGenerateInsights={generateInsights}
            loading={insightsLoading}
          />
        )}
      </div>

      {/* Student Profile Modal */}
      {selectedStudent && studentProfile && (
        <StudentProfileModal 
          student={studentProfile}
          onClose={() => {
            setSelectedStudent(null);
            setStudentProfile(null);
          }}
          onExportPDF={() => exportStudentPDF(selectedStudent)}
        />
      )}
    </div>
  );
};

export default AnalyticsPage;
