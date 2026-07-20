import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/config";
import { handleApiError, showSuccess } from "@/lib/handle-error";
import { useAsync } from "@/hooks/use-async";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/common";
import { toDisplayText, toBulletArray, toBulletList } from '@/lib/feedback-format';


export const SubmissionDetailPage = ({ user }) => {
  const { submissionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runDownload, downloading] = useAsync();
  const [runRegenerate, regenerating] = useAsync();
  const [runEmail, emailing] = useAsync();
  const [editMode, setEditMode] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState({});
  const [runSave, saving] = useAsync();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [runConvertToExample, convertingToExample] = useAsync();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [submissionId]);

  const loadData = async () => {
    try {
      const response = await axios.get(
        `${API}/teacher/submissions/${submissionId}`,
      );
      setData(response.data);
      setEditedFeedback({
        score: response.data.submission.score,
        www: toDisplayText(response.data.submission.www),
        next_steps: toDisplayText(response.data.submission.next_steps),
        overall_feedback: toDisplayText(response.data.submission.overall_feedback),
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async () => {
    try {
      await axios.post(
        `${API}/teacher/submissions/${submissionId}/mark-reviewed`,
      );
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to mark as reviewed");
    }
  };

  const handleConvertToExample = (exampleType) => {
    const explanation = prompt(
      `Why is this a ${exampleType} example? (optional)`,
    );
    return runConvertToExample(
      async () => {
        await axios.post(
          `${API}/teacher/submissions/${submissionId}/convert-to-example?example_type=${exampleType}&explanation=${encodeURIComponent(explanation || "")}`,
        );
        showSuccess(`Converted to ${exampleType} example`);
      },
      (e) => handleApiError(e, "Failed to convert to example"),
    );
  };

  const handleEmailPDF = () => {
    if (emailing) return;
    return runEmail(
      async () => {
        const response = await axios.post(
          `${API}/teacher/submissions/${submissionId}/email-pdf`,
        );
        showSuccess(response.data.message);
        loadData();
      },
      (e) => handleApiError(e, "Failed to email PDF"),
    );
  };

  const handleDownloadPDF = () => {
    if (downloading) return;
    return runDownload(
      async () => {
        const response = await axios.get(
          `${API}/teacher/submissions/${submissionId}/download-pdf`,
          { responseType: "blob" },
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const filename =
          `${data.submission.student_name}_${data.question.subject}_Feedback.pdf`.replace(
            / /g,
            "_",
          );
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      },
      (e) => handleApiError(e, "PDF generation failed. Please retry."),
    );
  };

  const handleRegeneratePDF = () => {
    if (regenerating) return;
    return runRegenerate(
      async () => {
        await axios.post(
          `${API}/teacher/submissions/${submissionId}/regenerate-pdf`,
        );
        showSuccess("PDF regenerated successfully!");
        loadData();
      },
      (e) => handleApiError(e, "Failed to regenerate PDF"),
    );
  };

  const handleSaveFeedback = () => runSave(
    async () => {
      await axios.put(`${API}/teacher/submissions/${submissionId}`, {
            ...editedFeedback,
            www: toBulletArray(editedFeedback.www),
            next_steps: toBulletArray(editedFeedback.next_steps),
            overall_feedback: toBulletArray(editedFeedback.overall_feedback),
          });
      showSuccess("Feedback saved successfully!");
      setEditMode(false);
      loadData();
    },
    (e) => handleApiError(e, "Failed to save feedback"),
  );

  if (loading) return <PageLoader />;

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Submission not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() =>
            navigate(`/teacher/assessments/${data.assessment.id}`)
          }
          className="text-sm text-gray-600 hover:text-blue-600 mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        {/* Needs Review Banner */}
        {data.submission.needs_review && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-semibold text-amber-800">
                  Needs Teacher Review
                </p>
                {data.submission.review_reasons?.length > 0 && (
                  <p className="text-sm text-amber-700">
                    {data.submission.review_reasons.join(", ")}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleMarkReviewed}
              className="bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700"
              data-testid="mark-reviewed-btn"
            >
              Mark as Reviewed
            </button>
          </div>
        )}

        <div className="bg-white p-8 rounded-lg shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2
                  className="text-2xl font-bold text-gray-900"
                  data-testid="submission-detail-title"
                >
                  {data.submission.student_name}
                </h2>
                {data.submission.ai_confidence !== undefined && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      data.submission.ai_confidence >= 0.8
                        ? "bg-green-100 text-green-700"
                        : data.submission.ai_confidence >= 0.6
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    AI Confidence:{" "}
                    {Math.round(data.submission.ai_confidence * 100)}%
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {data.question.subject} - {data.question.topic}
              </p>
              {data.submission.moderated_at && (
                <p className="text-xs text-green-600 mt-1">
                  Feedback moderated
                </p>
              )}
              {data.submission.email_sent_at && (
                <p className="text-xs text-indigo-600 mt-1">
                  Email sent to {data.submission.email_sent_to}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {data.submission.status === "marked" && !editMode && (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700"
                    data-testid="edit-feedback-btn"
                  >
                    Edit Feedback
                  </button>
                  {/* Convert to Example Dropdown */}
                  <div className="relative group">
                    <button
                      className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      disabled={convertingToExample}
                    >
                      {convertingToExample ? "Saving..." : "Save as Example"}
                    </button>
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                      <button
                        onClick={() => handleConvertToExample("good")}
                        className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                        data-testid="save-good-example-btn"
                      >
                        Good Answer Example
                      </button>
                      <button
                        onClick={() => handleConvertToExample("bad")}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        data-testid="save-bad-example-btn"
                      >
                        Poor Answer Example
                      </button>
                    </div>
                  </div>
                </>
              )}
              <button
                onClick={handleRegeneratePDF}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={regenerating}
                data-testid="regenerate-pdf-btn"
              >
                {regenerating ? "Regenerating..." : "Regenerate PDF"}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={downloading}
                data-testid="download-pdf-btn"
              >
                {downloading ? "Downloading..." : "Download PDF"}
              </button>
              {data.submission.status === "marked" &&
                !data.submission.email_sent_at && (
                  <button
                    onClick={handleEmailPDF}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    disabled={emailing}
                    data-testid="email-pdf-btn"
                  >
                    {emailing ? "Emailing..." : "Email PDF to Student"}
                  </button>
                )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Question
              </h3>
              <p className="text-gray-700" data-testid="question-text">
                {data.question.question_text}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Student's Answer
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p
                  className="text-gray-700 whitespace-pre-wrap"
                  data-testid="student-answer"
                >
                  {data.submission.answer_text}
                </p>
              </div>
            </div>

            {data.submission.status === "marked" && (
              <>
                {/* Mark Breakdown Section */}
                {data.submission.mark_breakdown &&
                  data.submission.mark_breakdown.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        data-testid="toggle-breakdown-btn"
                      >
                        <span className="font-medium text-gray-900">
                          Mark Breakdown
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-500 transform transition-transform ${showBreakdown ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {showBreakdown && (
                        <div className="p-4 space-y-3">
                          {data.submission.mark_breakdown.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                            >
                              <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  item.marks_awarded === item.marks_available
                                    ? "bg-green-100 text-green-700"
                                    : item.marks_awarded > 0
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {item.marks_awarded}/{item.marks_available}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {item.point}
                                </p>
                                {item.evidence && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">
                                      Evidence:{" "}
                                    </span>
                                    <span className="italic">
                                      "{item.evidence}"
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                {editMode ? (
                  /* Edit Mode */
                  <div className="space-y-4 border-2 border-amber-200 bg-amber-50 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-amber-800">
                        Editing Feedback
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditMode(false)}
                          className="text-gray-600 hover:text-gray-800 py-1 px-3"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveFeedback}
                          disabled={saving}
                          className="bg-green-600 text-white py-1 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                          data-testid="save-feedback-btn"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Score (out of {data.question.max_marks})
                      </label>
                      <input
                        type="number"
                        className="w-32 px-3 py-2 border rounded-lg"
                        value={editedFeedback.score || ""}
                        onChange={(e) =>
                          setEditedFeedback({
                            ...editedFeedback,
                            score: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        max={data.question.max_marks}
                        data-testid="edit-score-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        What Went Well
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        value={editedFeedback.www || ""}
                        onChange={(e) =>
                          setEditedFeedback({
                            ...editedFeedback,
                            www: e.target.value,
                          })
                        }
                        data-testid="edit-www-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Next Steps
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        value={editedFeedback.next_steps || ""}
                        onChange={(e) =>
                          setEditedFeedback({
                            ...editedFeedback,
                            next_steps: e.target.value,
                          })
                        }
                        data-testid="edit-next-steps-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overall Feedback
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        value={editedFeedback.overall_feedback || ""}
                        onChange={(e) =>
                          setEditedFeedback({
                            ...editedFeedback,
                            overall_feedback: e.target.value,
                          })
                        }
                        data-testid="edit-overall-feedback-input"
                      />
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <p className="text-gray-600 text-sm mb-1">Score</p>
                      <p
                        className="text-3xl font-bold text-blue-600"
                        data-testid="score"
                      >
                        {data.submission.score}/{data.question.max_marks}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        What Went Well
                      </h3>
                      <p className="text-gray-700" data-testid="www">
                        {toBulletList(data.submission.www).map((item, i) => (
                          <span key={i} className="block">• {item}</span>
                        ))}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Next Steps
                      </h3>
                      <p className="text-gray-700" data-testid="Next steps">
                        {toBulletList(data.submission.www).map((item, i) => (  
                          <span key={i} className="block">• {item}</span>
                        ))}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Overall Feedback
                      </h3>
                      <p className="text-gray-700" data-testid="overall-feedback">
                        {toBulletList(data.submission.www).map((item, i) => (   
                          <span key={i} className="block">• {item}</span>
                        ))}
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
