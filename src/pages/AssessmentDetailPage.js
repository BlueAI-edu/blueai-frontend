import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/config";
import { handleApiError, showSuccess } from "@/lib/handle-error";
import { useAsync } from "@/hooks/use-async";
import { Navbar } from "@/components/Navbar";

export const AssessmentDetailPage = ({ user }) => {
  const { assessmentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [releasingIds, setReleasingIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    try {
      const response = await axios.get(
        `${API}/teacher/assessments/${assessmentId}`,
      );
      const payload = response.data;
      // If this is an enhanced assessment (has assessmentMode and no classic question),
      // redirect to the enhanced detail page which knows how to render it.
      const isEnhanced =
        payload?.assessment?.assessmentMode &&
        payload.assessment.assessmentMode !== "CLASSIC";
      if (isEnhanced) {
        navigate(`/teacher/assessments/${assessmentId}/enhanced`, { replace: true });
        return;
      }
      setData(payload);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (submission) => {
    if (downloadingIds.has(submission.attempt_id)) return;

    setDownloadingIds((prev) => new Set(prev).add(submission.attempt_id));

    try {
      const response = await axios.get(
        `${API}/teacher/submissions/${submission.attempt_id}/download-pdf`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename =
        `${submission.student_name}_${data.question.subject}_Feedback.pdf`.replace(
          / /g,
          "_",
        );
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(submission.attempt_id);
        return newSet;
      });
    } catch (error) {
      handleApiError(error, "PDF generation failed. Please retry.");
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(submission.attempt_id);
        return newSet;
      });
    }
  };

  const handleReleaseFeedback = async (submission) => {
    if (releasingIds.has(submission.attempt_id)) return;

    setReleasingIds((prev) => new Set(prev).add(submission.attempt_id));

    try {
      await axios.post(
        `${API}/teacher/submissions/${submission.attempt_id}/release-feedback`,
      );
      // Reload data to reflect the change
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to release feedback");
    } finally {
      setReleasingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(submission.attempt_id);
        return newSet;
      });
    }
  };

  const handleBulkReleaseFeedback = async () => {
    if (
      !window.confirm(
        "Release feedback for all marked submissions? Students will be able to see their feedback immediately.",
      )
    )
      return;

    try {
      const response = await axios.post(
        `${API}/teacher/assessments/${assessmentId}/release-all-feedback`,
      );
      showSuccess(response.data.message);
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to release feedback");
    }
  };

  // Batch Export Functions
  const [runExportCSV, exportingCSV] = useAsync();
  const [runExportZIP, exportingZIP] = useAsync();
  const [runEmailAll, emailingAll] = useAsync();

  const handleExportCSV = () => runExportCSV(
    async () => {
      const response = await axios.get(
        `${API}/teacher/assessments/${assessmentId}/export-csv`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Submissions_${data.question.subject}_${data.assessment.join_code}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    (e) => handleApiError(e, "Failed to export CSV"),
  );

  const handleExportAllPDFs = () => runExportZIP(
    async () => {
      const response = await axios.get(
        `${API}/teacher/assessments/${assessmentId}/export-pdfs-zip`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `PDFs_${data.question.subject}_${data.assessment.join_code}.zip`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    (e) => handleApiError(e, "Failed to export PDFs"),
  );

  const handleEmailAllPDFs = () => {
    if (
      !window.confirm(
        "Email PDF reports to all students with email addresses? Only released, marked submissions will be emailed.",
      )
    )
      return;

    return runEmailAll(
      async () => {
        const response = await axios.post(
          `${API}/teacher/assessments/${assessmentId}/email-all-pdfs`,
        );
        showSuccess(response.data.message);
        loadData();
      },
      (e) => handleApiError(e, "Failed to email PDFs"),
    );
  };

  // Count unreleased marked submissions
  const unreleasedCount =
    data?.submissions?.filter(
      (s) => s.status === "marked" && !s.feedback_released,
    ).length || 0;
  const markedCount =
    data?.submissions?.filter((s) => s.status === "marked").length || 0;
  const emailableCount =
    data?.submissions?.filter(
      (s) => s.status === "marked" && s.feedback_released && !s.email_sent_at,
    ).length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.question || !data.assessment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-800">Assessment not found</p>
          <button
            onClick={() => navigate("/teacher/assessments")}
            className="mt-4 text-blue-600 hover:underline"
          >
            ← Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/teacher/assessments")}
          className="text-sm text-gray-600 hover:text-blue-600 mb-4 flex items-center gap-1"
        >
          ← Back to Assessments
        </button>
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                data-testid="assessment-detail-title"
              >
                {data.question.subject}
              </h2>
              <p className="text-gray-700 mb-2">
                <strong>Question:</strong> {data.question.question_text}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Max Marks:</strong> {data.question.max_marks}
              </p>
              <p className="text-gray-600">
                <strong>Join Code:</strong>{" "}
                <span className="text-blue-600 font-bold">
                  {data.assessment.join_code}
                </span>
              </p>
            </div>
            <button
              onClick={() =>
                navigate(`/teacher/assessments/${assessmentId}/security-report`)
              }
              className="bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 flex items-center gap-2"
              data-testid="view-security-report-btn"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Security Report
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3
              className="text-xl font-semibold text-gray-900"
              data-testid="submissions-title"
            >
              Submissions ({data.submissions.length})
            </h3>
            <div className="flex gap-2 flex-wrap">
              {/* Batch Export Buttons */}
              <button
                onClick={handleExportCSV}
                disabled={exportingCSV || data.submissions.length === 0}
                className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                data-testid="export-csv-btn"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {exportingCSV ? "Exporting..." : "Export CSV"}
              </button>

              {markedCount > 0 && (
                <button
                  onClick={handleExportAllPDFs}
                  disabled={exportingZIP}
                  className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                  data-testid="export-pdfs-zip-btn"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  {exportingZIP
                    ? "Generating..."
                    : `Download All PDFs (${markedCount})`}
                </button>
              )}

              {emailableCount > 0 && (
                <button
                  onClick={handleEmailAllPDFs}
                  disabled={emailingAll}
                  className="bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                  data-testid="email-all-pdfs-btn"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {emailingAll
                    ? "Emailing..."
                    : `Email All (${emailableCount})`}
                </button>
              )}

              {unreleasedCount > 0 && (
                <button
                  onClick={handleBulkReleaseFeedback}
                  className="bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 flex items-center gap-1 text-sm"
                  data-testid="bulk-release-feedback-btn"
                >
                  <svg
                    className="w-4 h-4"
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
                  Release All ({unreleasedCount})
                </button>
              )}
            </div>
          </div>

          {data.submissions.length === 0 ? (
            <p
              className="text-gray-600 text-center py-8"
              data-testid="no-submissions"
            >
              No submissions yet. Share the join code with students so they can submit their work.
            </p>
          ) : (
            <div className="space-y-4" data-testid="submissions-list">
              {data.submissions.map((sub) => (
                <div
                  key={sub.attempt_id}
                  className="border border-gray-200 rounded-lg p-4"
                  data-testid={`submission-${sub.attempt_id}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {sub.student_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {sub.submitted_at
                          ? new Date(sub.submitted_at).toLocaleString()
                          : "In progress"}
                      </p>
                      {sub.feedback_released && (
                        <span className="text-xs text-green-600">
                          ✓ Feedback released
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {sub.status === "marked" ? (
                        <>
                          <span className="text-lg font-bold text-green-600">
                            {sub.score}/{data.question.max_marks}
                          </span>
                          {!sub.feedback_released && (
                            <button
                              onClick={() => handleReleaseFeedback(sub)}
                              className="bg-purple-600 text-white py-1 px-3 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                              disabled={releasingIds.has(sub.attempt_id)}
                              data-testid={`release-feedback-${sub.attempt_id}`}
                            >
                              {releasingIds.has(sub.attempt_id)
                                ? "Releasing..."
                                : "Release Feedback"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPDF(sub)}
                            className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            disabled={downloadingIds.has(sub.attempt_id)}
                            data-testid={`download-pdf-${sub.attempt_id}`}
                          >
                            {downloadingIds.has(sub.attempt_id)
                              ? "Downloading..."
                              : "Download PDF"}
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/teacher/submissions/${sub.attempt_id}`)
                            }
                            className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                            data-testid={`view-submission-${sub.attempt_id}`}
                          >
                            View Details
                          </button>
                        </>
                      ) : sub.status === "error" ? (
                        <span className="text-red-600 text-sm">
                          Marking could not be completed
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">
                          Awaiting marking
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
