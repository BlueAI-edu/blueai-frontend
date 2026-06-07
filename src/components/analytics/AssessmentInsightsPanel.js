import { useState } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

// Color constants
const COLORS = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  gray: '#6b7280'
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
    name: (a.title || a.subject)?.substring(0, 12) || 'Assessment',
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
                  {a.title || a.subject} - {a.total_submissions} submissions
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
          No assessment insights available yet. Data will appear here once students have submitted work.
        </div>
      )}
    </div>
  );
};

export default AssessmentInsightsPanel;
