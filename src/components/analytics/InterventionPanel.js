
// Panel C: Class Support Indicators (Intervention)
const InterventionPanel = ({ overview, aiInsights, onGenerateInsights, loading }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900" data-testid="class-support-title">
          Intervention Indicators
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
              Generate Insights
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
          <p className="text-sm text-red-600">Need Support</p>
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
            AI Recommendation
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
            <p className="text-gray-500 text-sm">All students are on track</p>
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
            <p className="text-gray-500 text-sm">No declining trends detected</p>
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
              <p className="text-gray-500 text-sm">All topics are performing well</p>
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
              <p className="text-gray-500 text-sm">No strong topics identified yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterventionPanel;
