import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/config";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/common";

// Security Report Page
export const SecurityReportPage = ({ user }) => {
  const { assessmentId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReport();
  }, [assessmentId]);

  const loadReport = async () => {
    try {
      const response = await axios.get(
        `${API}/teacher/assessments/${assessmentId}/security-report`,
      );
      setReport(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "tab_hidden":
        return "👁️";
      case "window_blur":
        return "🔄";
      case "fullscreen_exit_security_breach":
        return "⬜";
      case "escape_key_pressed_in_fullscreen":
        return "🔑";
      case "fullscreen_not_supported":
        return "⚠️";
      default:
        return "❓";
    }
  };

  const getEventLabel = (eventType) => {
    switch (eventType) {
      case "tab_hidden":
        return "Tab Switch";
      case "window_blur":
        return "Window Lost Focus";
      case "fullscreen_exit_security_breach":
        return "Exited Fullscreen";
      case "escape_key_pressed_in_fullscreen":
        return "Escape Key Pressed";
      case "fullscreen_not_supported":
        return "Fullscreen Not Supported";
      default:
        return eventType;
    }
  };

  if (loading) return <PageLoader />;

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Report not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(`/teacher/assessments/${assessmentId}`)}
          className="text-sm text-gray-600 hover:text-blue-600 mb-4 flex items-center gap-1"
        >
          ← Back to Assessment
        </button>

        <div className="mb-8">
          <h2
            className="text-3xl font-bold text-gray-900 mb-2"
            data-testid="security-report-title"
          >
            Security Report
          </h2>
          <p className="text-gray-600">
            Monitor student activity during the assessment
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-600">
              {report.total_submissions}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">With Security Events</p>
            <p className="text-3xl font-bold text-yellow-600">
              {report.submissions_with_events}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Total Events</p>
            <p className="text-3xl font-bold text-orange-600">
              {report.total_events}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Flagged (3+ events)</p>
            <p className="text-3xl font-bold text-red-600">
              {report.flagged_count}
            </p>
          </div>
          {/* NEW: Needs Review card */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
            <p className="text-gray-600 text-sm mb-1">Needs Review</p>
            <p className="text-3xl font-bold text-yellow-600">
              {report.needs_review_count || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Fullscreen exits</p>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">
              Student Activity
            </h3>
          </div>

          {report.report.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium">No security events detected</p>
              <p className="text-sm text-gray-500">
                All students completed the assessment without any flagged
                activity
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {report.report.map((student) => (
                <div
                  key={student.attempt_id}
                  className={`p-6 ${student.flagged ? "bg-red-50" : ""}`}
                  data-testid={`security-student-${student.attempt_id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {student.student_name}
                        </h4>
                        {/* NEW: Needs Review badge */}
                        {student.needs_review && (
                          <span
                            className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium"
                            title={student.flagged_reason}
                          >
                            ⚠️ Needs Review
                          </span>
                        )}
                        {student.flagged && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                            FLAGGED
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            student.status === "marked"
                              ? "bg-green-100 text-green-700"
                              : student.status === "submitted"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </div>

                      {/* Event Summary */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {Object.entries(student.event_summary).map(
                          ([type, count]) =>
                            count > 0 && (
                              <div
                                key={type}
                                className="flex items-center gap-1"
                              >
                                <span>{getEventIcon(type)}</span>
                                <span className="text-gray-600">
                                  {getEventLabel(type)}:
                                </span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ),
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {student.event_count}
                        </p>
                        <p className="text-xs text-gray-500">events</p>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedStudent(
                            selectedStudent === student.attempt_id
                              ? null
                              : student.attempt_id,
                          )
                        }
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {selectedStudent === student.attempt_id
                          ? "Hide Details"
                          : "Show Details"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Event Details */}
                  {selectedStudent === student.attempt_id && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      
                      {/* ACCEPTANCE CRITERIA: Per-Student Fullscreen Exit Attempt History */}
                      {student.fullscreen_exit_attempts && student.fullscreen_exit_attempts.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <h5 className="font-semibold text-gray-900 text-base">
                              Fullscreen Exit Attempts
                            </h5>
                            {student.locked_out && (
                              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-medium">
                                LOCKED OUT
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 bg-white rounded p-3 border-2 border-orange-200">
                            {student.fullscreen_exit_attempts.map((attempt, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center justify-between p-3 rounded text-sm ${
                                  attempt.locked_out 
                                    ? "bg-red-50 border-l-4 border-red-500" 
                                    : "bg-yellow-50 border-l-4 border-yellow-500"
                                }`}
                                data-testid={`fullscreen-attempt-${idx}`}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900">
                                      {attempt.display_label}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {new Date(attempt.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                {attempt.locked_out && (
                                  <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold ml-4 whitespace-nowrap">
                                    AUTO-LOGGED OFF
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ACCEPTANCE CRITERIA: Complete Event Timeline */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">
                          Complete Event Timeline
                        </h5>
                        <div className="space-y-2 max-h-80 overflow-y-auto bg-white rounded p-3 border border-gray-200">
                          {student.events.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">No events logged</p>
                          ) : (
                            student.events.map((event, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 text-sm pb-2 border-b border-gray-100 last:border-b-0"
                                data-testid={`security-event-${idx}`}
                              >
                                <div className="text-gray-400 w-40 pt-1 flex-shrink-0 font-mono text-xs">
                                  {new Date(event.timestamp).toLocaleString()}
                                </div>
                                <span className="text-lg flex-shrink-0">
                                  {getEventIcon(event.type)}
                                </span>
                                <div className="flex-1 pt-1">
                                  <span className="text-gray-700">
                                    {getEventLabel(event.type)}
                                  </span>
                                  {event.type === "fullscreen_exit_security_breach" && event.exit_attempt && (
                                    <span className="ml-2 text-orange-600 font-semibold">
                                      (Attempt {event.exit_attempt}/3)
                                    </span>
                                  )}
                                  {event.student_name && event.student_name !== student.student_name && (
                                    <span className="ml-2 text-gray-500 text-xs">
                                      — {event.student_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};