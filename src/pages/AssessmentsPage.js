import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { handleApiError, showSuccess } from "@/lib/handle-error";
import { teacherApi } from "@/services/api";
import { Navbar } from "@/components/Navbar";
import { AssessmentHero } from "@/components/AssessmentHero";
import { AssessmentCard, AssessmentCardSkeleton, AssessmentEmptyState } from "@/components/AssessmentCard";
import { AssessmentStatsRow } from "@/components/AssessmentStatsRow";

export const AssessmentsPage = ({ user }) => {
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [assignmentsByAssessment, setAssignmentsByAssessment] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("assessments"); // assessments, templates
  const [visibleCount, setVisibleCount] = useState(10);
  const [statusFilter, setStatusFilter] = useState(null); // null | "all" | "started" | "submissions"
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [formData, setFormData] = useState({
    question_id: "",
    class_id: "",
    duration_minutes: "",
    auto_close: false,
  });
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    description: "",
    question_id: "",
    default_class_id: "",
    duration_minutes: "",
    auto_close: false,
  });
  const navigate = useNavigate();
  const listRef = useRef(null);
  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assessmentsRes, questionsRes, classesRes, templatesRes, assignmentsRes] =
        await Promise.all([
          teacherApi.getAssessments(),
          teacherApi.getQuestions(),
          teacherApi.getClasses(),
          teacherApi.getTemplates(),
          teacherApi.getAssignments().catch(() => ({ data: { assignments: [] } })),
        ]);
      setAssessments(assessmentsRes.data);
      setQuestions(questionsRes.data);
      setClasses(classesRes.data.classes || []);
      setTemplates(templatesRes.data.templates || []);
      const grouped = {};
      for (const a of (assignmentsRes.data.assignments || [])) {
        if (!grouped[a.assessment_id]) grouped[a.assessment_id] = [];
        grouped[a.assessment_id].push(a);
      }
      setAssignmentsByAssessment(grouped);
      setLoading(false);
      const dashboardRes = await teacherApi.getDashboard().catch((err) => {
        console.log('Dashboard error:', err);
        return { data: {} };
      });
      setTotalSubmissions(dashboardRes.data.total_submissions ?? 0);
      const reviewRes = await teacherApi.getNeedsReview().catch(() => ({ data: {} }));
      setReviewCount(reviewRes.data.total_count ?? 0);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await teacherApi.createAssessment({
        question_id: formData.question_id,
        class_id: formData.class_id || null,
        duration_minutes: formData.duration_minutes
          ? parseInt(formData.duration_minutes)
          : null,
        auto_close: formData.auto_close,
      });
      setShowForm(false);
      setFormData({
        question_id: "",
        class_id: "",
        duration_minutes: "",
        auto_close: false,
      });
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to create assessment");
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await teacherApi.createTemplate({
        name: templateFormData.name,
        description: templateFormData.description || null,
        question_id: templateFormData.question_id,
        default_class_id: templateFormData.default_class_id || null,
        duration_minutes: templateFormData.duration_minutes
          ? parseInt(templateFormData.duration_minutes)
          : null,
        auto_close: templateFormData.auto_close,
      });
      setShowTemplateForm(false);
      setTemplateFormData({
        name: "",
        description: "",
        question_id: "",
        default_class_id: "",
        duration_minutes: "",
        auto_close: false,
      });
      loadData();
      showSuccess("Template created successfully!");
    } catch (error) {
      handleApiError(error, "Failed to create template");
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      const response = await teacherApi.useTemplate(template.id);
      showSuccess(response.data.message);
      setActiveTab("assessments");
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to create assessment from template");
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await teacherApi.deleteTemplate(templateId);
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to delete template");
    }
  };

  const handleStart = async (id) => {
    try {
      await teacherApi.startAssessment(id);
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to start assessment");
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm("Close this assessment? Students will no longer be able to join.")) return;
    try {
      await teacherApi.closeAssessment(id);
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to close assessment");
    }
  };

  const handleReopen = async (id) => {
    if (!window.confirm("Reopen this assessment? It will be set back to Draft so you can edit it.")) return;
    try {
      await teacherApi.reopenAssessment(id);
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to reopen assessment");
    }
  };

  const handleDeleteAssessment = async (id, title) => {
    if (!window.confirm(`Permanently delete "${title}"?\n\nThis will also remove all student attempts and cannot be undone.`)) return;
    try {
      await teacherApi.deleteAssessment(id);
      loadData();
    } catch (error) {
      handleApiError(error, "Failed to delete assessment");
    }
  };

  const getStatusBadge = (status) => {
    const labels = {
      draft: 'Draft',
      published: 'Published',
      started: 'In Progress',
      closed: 'Closed',
    };
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      published: "bg-blue-100 text-blue-700",
      started: "bg-green-100 text-green-700",
      closed: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AssessmentHero
          onCreateEnhanced={() => navigate("/teacher/assessments/create")}
          onClassicMode={() => setShowForm(true)}
          liveCount={assessments.filter((a) => a.status === "started").length}
          onOpenLive={() => { setActiveTab("assessments"); setStatusFilter("started"); scrollToList(); }}
        />

        <AssessmentStatsRow
          loading={loading}
          totalAssessments={assessments.length}
          liveAssessments={assessments.filter((a) => a.status === "started").length}
          totalSubmissions={totalSubmissions}
          reviewNeeded={reviewCount}
          activeFilter={statusFilter}
          onFilterAll={() => { setActiveTab("assessments"); setStatusFilter("all"); scrollToList(); }}
          onFilterLive={() => { setActiveTab("assessments"); setStatusFilter("started"); scrollToList(); }}
          onFilterSubmissions={() => { setActiveTab("assessments"); setStatusFilter("submissions"); scrollToList(); }}
          onFilterReview={() => navigate("/teacher/dashboard")}
        />

        {/* Tab toolbar — template-mode gets its own CTA here */}
        {activeTab === "templates" && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowTemplateForm(true)}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
              data-testid="new-template-btn"
            >
              New Template
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab("assessments")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "assessments"
                ? "bg-white text-blue-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
            data-testid="assessments-tab"
          >
            Assessments ({assessments.length})
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "templates"
                ? "bg-white text-purple-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
            data-testid="templates-tab"
          >
            Templates ({templates.length})
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <>
            {/* Create Template Form */}
            {showTemplateForm && (
              <div
                className="bg-white p-6 rounded-lg shadow mb-6 border-2 border-purple-200"
                data-testid="template-form"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-700">
                  Create Template
                </h3>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={templateFormData.name}
                        onChange={(e) =>
                          setTemplateFormData({
                            ...templateFormData,
                            name: e.target.value,
                          })
                        }
                        required
                        placeholder="e.g., Weekly Physics Quiz"
                        data-testid="template-name-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={templateFormData.description}
                        onChange={(e) =>
                          setTemplateFormData({
                            ...templateFormData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={templateFormData.question_id}
                      onChange={(e) =>
                        setTemplateFormData({
                          ...templateFormData,
                          question_id: e.target.value,
                        })
                      }
                      required
                      data-testid="template-question-select"
                    >
                      <option value="">-- Select a question --</option>
                      {questions.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.subject} - {q.topic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Class
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg"
                        value={templateFormData.default_class_id}
                        onChange={(e) =>
                          setTemplateFormData({
                            ...templateFormData,
                            default_class_id: e.target.value,
                          })
                        }
                      >
                        <option value="">-- No default class --</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.class_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={templateFormData.duration_minutes}
                        onChange={(e) =>
                          setTemplateFormData({
                            ...templateFormData,
                            duration_minutes: e.target.value,
                          })
                        }
                        placeholder="Optional"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="template_auto_close"
                      checked={templateFormData.auto_close}
                      onChange={(e) =>
                        setTemplateFormData({
                          ...templateFormData,
                          auto_close: e.target.checked,
                        })
                      }
                    />
                    <label
                      htmlFor="template_auto_close"
                      className="text-sm text-gray-700"
                    >
                      Auto-close when time expires
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
                      data-testid="save-template-btn"
                    >
                      Save Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTemplateForm(false)}
                      className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Templates List */}
            {templates.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-purple-600 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">
                  No templates yet. Create your first template to quickly reuse
                  assessment configurations.
                </p>
                <button
                  onClick={() => setShowTemplateForm(true)}
                  className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
                >
                  Create Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete template"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-500 mb-3">
                        {template.description}
                      </p>
                    )}
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>
                        <span className="font-medium">Question:</span>{" "}
                        {template.question_subject} -{" "}
                        {template.question_topic || "N/A"}
                      </p>
                      {template.default_class_name && (
                        <p>
                          <span className="font-medium">Class:</span>{" "}
                          {template.default_class_name}
                        </p>
                      )}
                      {template.duration_minutes && (
                        <p>
                          <span className="font-medium">Duration:</span>{" "}
                          {template.duration_minutes} min
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Used:</span>{" "}
                        {template.use_count} times
                      </p>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                      data-testid={`use-template-${template.id}`}
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Create Assessment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Assessments Tab */}
        {activeTab === "assessments" && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* ── Main column ── */}
            <div className="flex-1 min-w-0">
            {showForm && (
              <div
                className="bg-white p-6 rounded-lg shadow mb-6"
                data-testid="assessment-form"
              >
                <h3 className="text-xl font-semibold mb-4">
                  Create Assessment
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Question
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.question_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          question_id: e.target.value,
                        })
                      }
                      required
                      data-testid="question-select"
                    >
                      <option value="">-- Select a question --</option>
                      {questions.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.subject} - {q.topic}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Phase 4: Class Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link to Class (Optional)
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.class_id}
                      onChange={(e) =>
                        setFormData({ ...formData, class_id: e.target.value })
                      }
                      data-testid="class-select"
                    >
                      <option value="">
                        -- No class (students enter name) --
                      </option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} {c.subject ? `(${c.subject})` : ""} -{" "}
                          {c.student_count} students
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      If linked, students will select their name from a dropdown
                      instead of typing it.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.duration_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_minutes: e.target.value,
                        })
                      }
                      placeholder="Optional - leave empty for no time limit"
                      min="1"
                      data-testid="duration-input"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="auto_close"
                      checked={formData.auto_close}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_close: e.target.checked,
                        })
                      }
                      data-testid="auto-close-checkbox"
                    />
                    <label
                      htmlFor="auto_close"
                      className="text-sm text-gray-700"
                    >
                      Auto-close when time expires
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                      data-testid="create-assessment-submit"
                    >
                      Create Assessment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                      data-testid="cancel-assessment-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {(() => {
              const FILTER_STATUS_MAP = {
                started: "started",
                submissions: "closed",
              };
              const activeStatus = FILTER_STATUS_MAP[statusFilter];
              const filtered = activeStatus
                ? assessments.filter((a) => a.status === activeStatus)
                : assessments;

              const FILTER_LABELS = {
                all: "All Assessments",
                started: "Live Assessments",
                submissions: "With Submissions",
              };

              return loading ? (
                <div className="space-y-4" data-testid="assessments-loading">
                  {[1, 2, 3].map((n) => <AssessmentCardSkeleton key={n} />)}
                </div>
              ) : (
                <div ref={listRef}>
                  {/* Active filter pill */}
                  {statusFilter && statusFilter !== "all" && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-500">Filtered:</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200">
                        {FILTER_LABELS[statusFilter]}
                        <button
                          onClick={() => setStatusFilter(null)}
                          className="ml-0.5 text-indigo-500 hover:text-indigo-800"
                          aria-label="Clear filter"
                        >
                          ×
                        </button>
                      </span>
                      <span className="text-xs text-gray-400">({filtered.length} result{filtered.length !== 1 ? "s" : ""})</span>
                    </div>
                  )}

                  {assessments.length === 0 ? (
                    <AssessmentEmptyState
                      onCreateEnhanced={() => navigate("/teacher/assessments/create")}
                      onClassicMode={() => setShowForm(true)}
                    />
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-8 bg-white border border-dashed border-gray-200 rounded-xl text-center">
                      <p className="text-sm font-medium text-gray-600 mb-1">No assessments match this filter</p>
                      <p className="text-xs text-gray-400 mb-4">Try a different view or clear the filter</p>
                      <button
                        onClick={() => setStatusFilter(null)}
                        className="text-xs text-indigo-600 font-medium hover:underline"
                      >
                        Clear filter
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3" data-testid="assessments-list">
                        {filtered.slice(0, visibleCount).map((a) => {
                          const question = questions.find((q) => q.id === a.question_id);
                          return (
                            <AssessmentCard
                              key={a.id}
                              assessment={a}
                              question={question}
                              classes={classes}
                              assignments={assignmentsByAssessment[a.id] || []}
                              onStart={() => handleStart(a.id)}
                              onClose={() => handleClose(a.id)}
                              onReopen={() => handleReopen(a.id)}
                              onEdit={() => navigate(`/teacher/assessments/${a.id}/edit`)}
                              onViewSubmissions={() => navigate(`/teacher/assessments/${a.id}`)}
                              onViewEnhanced={() => navigate(`/teacher/assessments/${a.id}/enhanced`)}
                              onDelete={a.status !== 'started' ? () => handleDeleteAssessment(a.id, a.title || question?.topic || 'this assessment') : undefined}
                            />
                          );
                        })}
                      </div>

                      {filtered.length > visibleCount && (
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={() => setVisibleCount((n) => n + 10)}
                            className="px-5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
                            data-testid="load-more-btn"
                          >
                            Load more assessments ({filtered.length - visibleCount} remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
            </div>{/* end main column */}
          </div>
        )}
      </div>
    </div>
  );
};
