import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
};

const byNewest = (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''));

// Panel B: Assessment Insights (#408 items 9-10): only assessments with marked
// work, newest first and selected by default; no "Difficulty %" (it was just
// 100 minus the class average).
const AssessmentInsightsPanel = ({ assessments }) => {
  const navigate = useNavigate();
  const withWork = useMemo(
    () => (assessments || []).filter((a) => a.total_submissions > 0).sort(byNewest),
    [assessments]
  );
  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    if (!withWork.find((a) => a.assessment_id === selectedId)) setSelectedId(withWork[0]?.assessment_id || '');
  }, [withWork, selectedId]);
  const selected = withWork.find((a) => a.assessment_id === selectedId);

  const averages = withWork.slice(0, 12).reverse().map((a) => ({
    name: (a.title || a.subject || 'Assessment').substring(0, 14),
    fullName: a.title || a.subject,
    average: a.average_percentage || 0,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="assessment-insights-title">
        Assessment Insights
      </h3>

      {withWork.length > 0 ? (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <select
              className="border rounded-lg px-4 py-2 w-full max-w-md"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {withWork.map((a) => (
                <option key={a.assessment_id} value={a.assessment_id}>
                  {a.title || a.subject} ({a.total_submissions} marked)
                </option>
              ))}
            </select>
            {selected && (
              <button
                onClick={() => navigate(`/teacher/assessments/${selected.assessment_id}/analytics`)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Question-by-question analysis →
              </button>
            )}
          </div>

          {selected && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Class average</p>
                <p className="text-2xl font-bold text-blue-700">{selected.average_percentage}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Highest score</p>
                <p className="text-2xl font-bold text-green-700">{selected.highest_score}/{selected.max_marks}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600">Lowest score</p>
                <p className="text-2xl font-bold text-red-700">{selected.lowest_score}/{selected.max_marks}</p>
              </div>
            </div>
          )}

          {selected && (
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-700 mb-3">Mark distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={selected.distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" interval={0} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Students" fill={COLORS.blue}>
                    {(selected.distribution || []).map((entry, index) => (
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

          {averages.length > 1 && (
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-3">Class average by assessment</h4>
              <ResponsiveContainer width="100%" height={Math.max(200, averages.length * 30 + 40)}>
                <BarChart data={averages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={130} interval={0} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v}%`} labelFormatter={(_, p) => p?.[0]?.payload?.fullName || ''} />
                  <Bar dataKey="average" name="Class average" fill={COLORS.blue} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No data yet. Assessments appear here once a submission has been marked.
        </div>
      )}
    </div>
  );
};

export default AssessmentInsightsPanel;
