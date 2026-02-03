import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';

export const AssessmentsPage = ({ user }) => {
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('assessments'); // assessments, templates
  const [formData, setFormData] = useState({
    question_id: '',
    class_id: '',
    duration_minutes: '',
    auto_close: false
  });
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    question_id: '',
    default_class_id: '',
    duration_minutes: '',
    auto_close: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assessmentsRes, questionsRes, classesRes, templatesRes] = await Promise.all([
        axios.get(`${API}/teacher/assessments`),
        axios.get(`${API}/teacher/questions`),
        axios.get(`${API}/teacher/classes`),
        axios.get(`${API}/teacher/templates`)
      ]);
      setAssessments(assessmentsRes.data);
      setQuestions(questionsRes.data);
      setClasses(classesRes.data.classes || []);
      setTemplates(templatesRes.data.templates || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/teacher/assessments`, {
        question_id: formData.question_id,
        class_id: formData.class_id || null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        auto_close: formData.auto_close
      });
      setShowForm(false);
      setFormData({ question_id: '', class_id: '', duration_minutes: '', auto_close: false });
      loadData();
    } catch (error) {
      alert('Failed to create assessment');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/teacher/templates`, {
        name: templateFormData.name,
        description: templateFormData.description || null,
        question_id: templateFormData.question_id,
        default_class_id: templateFormData.default_class_id || null,
        duration_minutes: templateFormData.duration_minutes ? parseInt(templateFormData.duration_minutes) : null,
        auto_close: templateFormData.auto_close
      });
      setShowTemplateForm(false);
      setTemplateFormData({ name: '', description: '', question_id: '', default_class_id: '', duration_minutes: '', auto_close: false });
      loadData();
      alert('Template created successfully!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create template');
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      const response = await axios.post(`${API}/teacher/templates/${template.id}/create-assessment`);
      alert(response.data.message);
      setActiveTab('assessments');
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create assessment from template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await axios.delete(`${API}/teacher/templates/${templateId}`);
      loadData();
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  const handleStart = async (id) => {
    try {
      await axios.post(`${API}/teacher/assessments/${id}/start`);
      loadData();
    } catch (error) {
      alert('Failed to start assessment');
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm('Close this assessment?')) return;
    try {
      await axios.post(`${API}/teacher/assessments/${id}/close`);
      loadData();
    } catch (error) {
      alert('Failed to close assessment');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-blue-100 text-blue-700',
      started: 'bg-green-100 text-green-700',
      closed: 'bg-red-100 text-red-700'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <div className="flex gap-4">
              <button onClick={() => navigate('/teacher/dashboard')} className="text-gray-700 hover:text-blue-600">Dashboard</button>
              <button onClick={() => navigate('/teacher/questions')} className="text-gray-700 hover:text-blue-600">Questions</button>
              <button onClick={() => navigate('/teacher/assessments')} className="text-blue-600 font-medium">Assessments</button>
              {user.role === 'admin' && <button onClick={() => navigate('/admin/dashboard')} className="text-gray-700 hover:text-blue-600">Admin</button>}
            </div>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900" data-testid="assessments-title">Assessments</h2>
          <div className="flex gap-2">
            {activeTab === 'templates' ? (
              <button
                onClick={() => setShowTemplateForm(true)}
                className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
                data-testid="new-template-btn"
              >
                New Template
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/teacher/assessments/create')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium flex items-center gap-2"
                >
                  <span>✨</span>
                  Create Enhanced Assessment
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                  data-testid="new-assessment-btn"
                >
                  Classic Mode
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'assessments' 
                ? 'bg-white text-blue-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="assessments-tab"
          >
            Assessments ({assessments.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'templates' 
                ? 'bg-white text-purple-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="templates-tab"
          >
            Templates ({templates.length})
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <>
            {/* Create Template Form */}
            {showTemplateForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-6 border-2 border-purple-200" data-testid="template-form">
                <h3 className="text-xl font-semibold mb-4 text-purple-700">Create Template</h3>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={templateFormData.name}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                        required
                        placeholder="e.g., Weekly Physics Quiz"
                        data-testid="template-name-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={templateFormData.description}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={templateFormData.question_id}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, question_id: e.target.value })}
                      required
                      data-testid="template-question-select"
                    >
                      <option value="">-- Select a question --</option>
                      {questions.map((q) => (
                        <option key={q.id} value={q.id}>{q.subject} - {q.topic}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Class</label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg"
                        value={templateFormData.default_class_id}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, default_class_id: e.target.value })}
                      >
                        <option value="">-- No default class --</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.class_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={templateFormData.duration_minutes}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, duration_minutes: e.target.value })}
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
                      onChange={(e) => setTemplateFormData({ ...templateFormData, auto_close: e.target.checked })}
                    />
                    <label htmlFor="template_auto_close" className="text-sm text-gray-700">Auto-close when time expires</label>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700" data-testid="save-template-btn">
                      Save Template
                    </button>
                    <button type="button" onClick={() => setShowTemplateForm(false)} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300">
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
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">No templates yet. Create your first template to quickly reuse assessment configurations.</p>
                <button onClick={() => setShowTemplateForm(true)} className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700">
                  Create Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete template"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                    )}
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p><span className="font-medium">Question:</span> {template.question_subject} - {template.question_topic || 'N/A'}</p>
                      {template.default_class_name && (
                        <p><span className="font-medium">Class:</span> {template.default_class_name}</p>
                      )}
                      {template.duration_minutes && (
                        <p><span className="font-medium">Duration:</span> {template.duration_minutes} min</p>
                      )}
                      <p><span className="font-medium">Used:</span> {template.use_count} times</p>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                      data-testid={`use-template-${template.id}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
        {activeTab === 'assessments' && (
          <>
            {showForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-6" data-testid="assessment-form">
                <h3 className="text-xl font-semibold mb-4">Create Assessment</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Question</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.question_id}
                      onChange={(e) => setFormData({ ...formData, question_id: e.target.value })}
                      required
                      data-testid="question-select"
                    >
                      <option value="">-- Select a question --</option>
                      {questions.map((q) => (
                        <option key={q.id} value={q.id}>{q.subject} - {q.topic}</option>
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
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  data-testid="class-select"
                >
                  <option value="">-- No class (students enter name) --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} {c.subject ? `(${c.subject})` : ''} - {c.student_count} students
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  If linked, students will select their name from a dropdown instead of typing it.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, auto_close: e.target.checked })}
                  data-testid="auto-close-checkbox"
                />
                <label htmlFor="auto_close" className="text-sm text-gray-700">Auto-close when time expires</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700" data-testid="create-assessment-submit">
                  Create Assessment
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" data-testid="cancel-assessment-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : assessments.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center" data-testid="no-assessments">
            <p className="text-gray-600 mb-4">No assessments yet</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="assessments-list">
            {assessments.map((a) => {
              // Handle both Classic and Enhanced assessments
              const isEnhanced = a.assessmentMode && a.assessmentMode !== 'CLASSIC';
              const question = questions.find(q => q.id === a.question_id);
              
              // For enhanced assessments, get info from the assessment itself
              const displayTitle = isEnhanced ? (a.title || 'Untitled Assessment') : (question?.subject || 'Unknown');
              const displaySubject = isEnhanced ? (a.subject || 'N/A') : (question?.subject || 'Unknown');
              const displayTopic = isEnhanced ? `${a.questions?.length || 0} questions` : (question?.topic || '');
              const displayMode = isEnhanced ? (a.assessmentMode || 'ENHANCED').replace(/_/g, ' ') : 'CLASSIC';
              
              return (
                <div key={a.id} className="bg-white p-6 rounded-lg shadow" data-testid={`assessment-${a.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{displayTitle}</h3>
                        {getStatusBadge(a.status)}
                        {isEnhanced && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            ✨ {displayMode}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-1">{displayTopic}</p>
                      {a.duration_minutes && <p className="text-sm text-gray-500">Duration: {a.duration_minutes} minutes</p>}
                      {isEnhanced && a.totalMarks && (
                        <p className="text-sm text-gray-500">Total Marks: {a.totalMarks}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-blue-50 px-4 py-2 rounded">
                        <p className="text-xs text-gray-600">Join Code</p>
                        <p className="text-xl font-bold text-blue-600" data-testid={`join-code-${a.id}`}>{a.join_code}</p>
                      </div>
                      {a.status === 'started' && (
                        <div className="text-xs text-gray-500">
                          Link: {window.location.origin}/join
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {a.status === 'draft' && (
                      <button
                        onClick={() => handleStart(a.id)}
                        className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                        data-testid={`start-assessment-${a.id}`}
                      >
                        Start Assessment
                      </button>
                    )}
                    {a.status === 'published' && (
                      <button
                        onClick={() => handleStart(a.id)}
                        className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                        data-testid={`start-assessment-${a.id}`}
                      >
                        Start Assessment
                      </button>
                    )}
                    {a.status === 'started' && (
                      <button
                        onClick={() => handleClose(a.id)}
                        className="bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
                        data-testid={`close-assessment-${a.id}`}
                      >
                        Close Assessment
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Redirect to Enhanced detail page if it's an Enhanced Assessment
                        if (isEnhanced) {
                          navigate(`/teacher/assessments/${a.id}/enhanced`);
                        } else {
                          navigate(`/teacher/assessments/${a.id}`);
                        }
                      }}
                      className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                      data-testid={`view-submissions-${a.id}`}
                    >
                      View Submissions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

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
      const response = await axios.get(`${API}/teacher/assessments/${assessmentId}`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading assessment:', error);
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (submission) => {
    if (downloadingIds.has(submission.attempt_id)) return;
    
    setDownloadingIds(prev => new Set(prev).add(submission.attempt_id));

    try {
      const response = await axios.get(
        `${API}/teacher/submissions/${submission.attempt_id}/download-pdf`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `${submission.student_name}_${data.question.subject}_Feedback.pdf`.replace(/ /g, '_');
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.attempt_id);
        return newSet;
      });
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDF generation failed. Please retry.');
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.attempt_id);
        return newSet;
      });
    }
  };

  const handleReleaseFeedback = async (submission) => {
    if (releasingIds.has(submission.attempt_id)) return;
    
    setReleasingIds(prev => new Set(prev).add(submission.attempt_id));

    try {
      await axios.post(`${API}/teacher/submissions/${submission.attempt_id}/release-feedback`);
      // Reload data to reflect the change
      loadData();
    } catch (error) {
      console.error('Release feedback error:', error);
      alert(error.response?.data?.detail || 'Failed to release feedback');
    } finally {
      setReleasingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.attempt_id);
        return newSet;
      });
    }
  };

  const handleBulkReleaseFeedback = async () => {
    if (!window.confirm('Release feedback for all marked submissions? Students will be able to see their feedback immediately.')) return;
    
    try {
      const response = await axios.post(`${API}/teacher/assessments/${assessmentId}/release-all-feedback`);
      alert(response.data.message);
      loadData();
    } catch (error) {
      console.error('Bulk release feedback error:', error);
      alert(error.response?.data?.detail || 'Failed to release feedback');
    }
  };

  // Batch Export Functions
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingZIP, setExportingZIP] = useState(false);
  const [emailingAll, setEmailingAll] = useState(false);

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const response = await axios.get(`${API}/teacher/assessments/${assessmentId}/export-csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Submissions_${data.question.subject}_${data.assessment.join_code}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export CSV error:', error);
      alert('Failed to export CSV');
    }
    setExportingCSV(false);
  };

  const handleExportAllPDFs = async () => {
    setExportingZIP(true);
    try {
      const response = await axios.get(`${API}/teacher/assessments/${assessmentId}/export-pdfs-zip`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PDFs_${data.question.subject}_${data.assessment.join_code}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export PDFs error:', error);
      alert(error.response?.data?.detail || 'Failed to export PDFs');
    }
    setExportingZIP(false);
  };

  const handleEmailAllPDFs = async () => {
    if (!window.confirm('Email PDF reports to all students with email addresses? Only released, marked submissions will be emailed.')) return;
    
    setEmailingAll(true);
    try {
      const response = await axios.post(`${API}/teacher/assessments/${assessmentId}/email-all-pdfs`);
      alert(`${response.data.message}\n\nSent: ${response.data.summary.sent}\nFailed: ${response.data.summary.failed}\nNo email: ${response.data.summary.no_email}`);
      loadData();
    } catch (error) {
      console.error('Email all PDFs error:', error);
      alert(error.response?.data?.detail || 'Failed to email PDFs');
    }
    setEmailingAll(false);
  };

  // Count unreleased marked submissions
  const unreleasedCount = data?.submissions?.filter(s => s.status === 'marked' && !s.feedback_released).length || 0;
  const markedCount = data?.submissions?.filter(s => s.status === 'marked').length || 0;
  const emailableCount = data?.submissions?.filter(s => s.status === 'marked' && s.feedback_released && !s.email_sent_at).length || 0;

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
            onClick={() => navigate('/teacher/assessments')}
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
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <button onClick={() => navigate('/teacher/assessments')} className="text-gray-700 hover:text-blue-600">← Back to Assessments</button>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4" data-testid="assessment-detail-title">{data.question.subject}</h2>
              <p className="text-gray-700 mb-2"><strong>Question:</strong> {data.question.question_text}</p>
              <p className="text-gray-600 mb-2"><strong>Max Marks:</strong> {data.question.max_marks}</p>
              <p className="text-gray-600"><strong>Join Code:</strong> <span className="text-blue-600 font-bold">{data.assessment.join_code}</span></p>
            </div>
            <button
              onClick={() => navigate(`/teacher/assessments/${assessmentId}/security-report`)}
              className="bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 flex items-center gap-2"
              data-testid="view-security-report-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Security Report
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900" data-testid="submissions-title">Submissions ({data.submissions.length})</h3>
            <div className="flex gap-2 flex-wrap">
              {/* Batch Export Buttons */}
              <button
                onClick={handleExportCSV}
                disabled={exportingCSV || data.submissions.length === 0}
                className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                data-testid="export-csv-btn"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {exportingCSV ? 'Exporting...' : 'Export CSV'}
              </button>
              
              {markedCount > 0 && (
                <button
                  onClick={handleExportAllPDFs}
                  disabled={exportingZIP}
                  className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                  data-testid="export-pdfs-zip-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {exportingZIP ? 'Generating...' : `Download All PDFs (${markedCount})`}
                </button>
              )}

              {emailableCount > 0 && (
                <button
                  onClick={handleEmailAllPDFs}
                  disabled={emailingAll}
                  className="bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                  data-testid="email-all-pdfs-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {emailingAll ? 'Emailing...' : `Email All (${emailableCount})`}
                </button>
              )}
              
              {unreleasedCount > 0 && (
                <button
                  onClick={handleBulkReleaseFeedback}
                  className="bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 flex items-center gap-1 text-sm"
                  data-testid="bulk-release-feedback-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Release All ({unreleasedCount})
                </button>
              )}
            </div>
          </div>
          
          {data.submissions.length === 0 ? (
            <p className="text-gray-600 text-center py-8" data-testid="no-submissions">No submissions yet</p>
          ) : (
            <div className="space-y-4" data-testid="submissions-list">
              {data.submissions.map((sub) => (
                <div key={sub.attempt_id} className="border border-gray-200 rounded-lg p-4" data-testid={`submission-${sub.attempt_id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{sub.student_name}</h4>
                      <p className="text-sm text-gray-500">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'In progress'}
                      </p>
                      {sub.feedback_released && (
                        <span className="text-xs text-green-600">✓ Feedback released</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {sub.status === 'marked' ? (
                        <>
                          <span className="text-lg font-bold text-green-600">{sub.score}/{data.question.max_marks}</span>
                          {!sub.feedback_released && (
                            <button
                              onClick={() => handleReleaseFeedback(sub)}
                              className="bg-purple-600 text-white py-1 px-3 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                              disabled={releasingIds.has(sub.attempt_id)}
                              data-testid={`release-feedback-${sub.attempt_id}`}
                            >
                              {releasingIds.has(sub.attempt_id) ? 'Releasing...' : 'Release Feedback'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPDF(sub)}
                            className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            disabled={downloadingIds.has(sub.attempt_id)}
                            data-testid={`download-pdf-${sub.attempt_id}`}
                          >
                            {downloadingIds.has(sub.attempt_id) ? 'Downloading...' : 'Download PDF'}
                          </button>
                          <button
                            onClick={() => navigate(`/teacher/submissions/${sub.attempt_id}`)}
                            className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                            data-testid={`view-submission-${sub.attempt_id}`}
                          >
                            View Details
                          </button>
                        </>
                      ) : sub.status === 'error' ? (
                        <span className="text-red-600 text-sm">Marking failed</span>
                      ) : (
                        <span className="text-gray-600 text-sm">Not marked</span>
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

export const SubmissionDetailPage = ({ user }) => {
  const { submissionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [convertingToExample, setConvertingToExample] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [submissionId]);

  const loadData = async () => {
    try {
      const response = await axios.get(`${API}/teacher/submissions/${submissionId}`);
      setData(response.data);
      setEditedFeedback({
        score: response.data.submission.score,
        www: response.data.submission.www,
        next_steps: response.data.submission.next_steps,
        overall_feedback: response.data.submission.overall_feedback
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading submission:', error);
      setLoading(false);
    }
  };

  const handleMarkReviewed = async () => {
    try {
      await axios.post(`${API}/teacher/submissions/${submissionId}/mark-reviewed`);
      loadData();
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      alert('Failed to mark as reviewed');
    }
  };

  const handleConvertToExample = async (exampleType) => {
    const explanation = prompt(`Why is this a ${exampleType} example? (optional)`);
    setConvertingToExample(true);
    try {
      await axios.post(`${API}/teacher/submissions/${submissionId}/convert-to-example?example_type=${exampleType}&explanation=${encodeURIComponent(explanation || '')}`);
      alert(`Converted to ${exampleType} example for future AI calibration`);
    } catch (error) {
      console.error('Error converting to example:', error);
      alert(error.response?.data?.detail || 'Failed to convert to example');
    }
    setConvertingToExample(false);
  };

  const handleEmailPDF = async () => {
    if (emailing) return;
    setEmailing(true);
    try {
      const response = await axios.post(`${API}/teacher/submissions/${submissionId}/email-pdf`);
      alert(response.data.message);
      loadData();
    } catch (error) {
      console.error('Email PDF error:', error);
      alert(error.response?.data?.detail || 'Failed to email PDF');
    }
    setEmailing(false);
  };

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const response = await axios.get(
        `${API}/teacher/submissions/${submissionId}/download-pdf`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `${data.submission.student_name}_${data.question.subject}_Feedback.pdf`.replace(/ /g, '_');
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloading(false);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDF generation failed. Please retry.');
      setDownloading(false);
    }
  };

  const handleRegeneratePDF = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      await axios.post(`${API}/teacher/submissions/${submissionId}/regenerate-pdf`);
      alert('PDF regenerated successfully!');
      loadData();
    } catch (error) {
      console.error('PDF regeneration error:', error);
      alert('Failed to regenerate PDF');
    }
    setRegenerating(false);
  };

  const handleSaveFeedback = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/teacher/submissions/${submissionId}/moderate-feedback`, editedFeedback);
      alert('Feedback saved successfully!');
      setEditMode(false);
      loadData();
    } catch (error) {
      console.error('Save feedback error:', error);
      alert('Failed to save feedback');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen">Submission not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <button onClick={() => navigate(`/teacher/assessments/${data.assessment.id}`)} className="text-gray-700 hover:text-blue-600">← Back</button>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Needs Review Banner */}
        {data.submission.needs_review && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-amber-800">Needs Teacher Review</p>
                {data.submission.review_reasons?.length > 0 && (
                  <p className="text-sm text-amber-700">{data.submission.review_reasons.join(', ')}</p>
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
                <h2 className="text-2xl font-bold text-gray-900" data-testid="submission-detail-title">{data.submission.student_name}</h2>
                {data.submission.ai_confidence !== undefined && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    data.submission.ai_confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                    data.submission.ai_confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    AI Confidence: {Math.round(data.submission.ai_confidence * 100)}%
                  </span>
                )}
              </div>
              <p className="text-gray-600">{data.question.subject} - {data.question.topic}</p>
              {data.submission.moderated_at && (
                <p className="text-xs text-green-600 mt-1">Feedback moderated</p>
              )}
              {data.submission.email_sent_at && (
                <p className="text-xs text-indigo-600 mt-1">Email sent to {data.submission.email_sent_to}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {data.submission.status === 'marked' && !editMode && (
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
                      {convertingToExample ? 'Saving...' : 'Save as Example'}
                    </button>
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                      <button
                        onClick={() => handleConvertToExample('good')}
                        className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                        data-testid="save-good-example-btn"
                      >
                        Good Answer Example
                      </button>
                      <button
                        onClick={() => handleConvertToExample('bad')}
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
                {regenerating ? 'Regenerating...' : 'Regenerate PDF'}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={downloading}
                data-testid="download-pdf-btn"
              >
                {downloading ? 'Downloading...' : 'Download PDF'}
              </button>
              {data.submission.status === 'marked' && !data.submission.email_sent_at && (
                <button
                  onClick={handleEmailPDF}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  disabled={emailing}
                  data-testid="email-pdf-btn"
                >
                  {emailing ? 'Emailing...' : 'Email PDF to Student'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Question</h3>
              <p className="text-gray-700" data-testid="question-text">{data.question.question_text}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student's Answer</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap" data-testid="student-answer">{data.submission.answer_text}</p>
              </div>
            </div>

            {data.submission.status === 'marked' && (
              <>
                {/* Mark Breakdown Section */}
                {data.submission.mark_breakdown && data.submission.mark_breakdown.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      data-testid="toggle-breakdown-btn"
                    >
                      <span className="font-medium text-gray-900">Mark Breakdown</span>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${showBreakdown ? 'rotate-180' : ''}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showBreakdown && (
                      <div className="p-4 space-y-3">
                        {data.submission.mark_breakdown.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              item.marks_awarded === item.marks_available 
                                ? 'bg-green-100 text-green-700' 
                                : item.marks_awarded > 0 
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {item.marks_awarded}/{item.marks_available}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.point}</p>
                              {item.evidence && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Evidence: </span>
                                  <span className="italic">"{item.evidence}"</span>
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
                      <h3 className="text-lg font-semibold text-amber-800">Editing Feedback</h3>
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
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Score (out of {data.question.max_marks})</label>
                      <input
                        type="number"
                        className="w-32 px-3 py-2 border rounded-lg"
                        value={editedFeedback.score || ''}
                        onChange={(e) => setEditedFeedback({ ...editedFeedback, score: parseInt(e.target.value) || 0 })}
                        min="0"
                        max={data.question.max_marks}
                        data-testid="edit-score-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">What Went Well</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        value={editedFeedback.www || ''}
                        onChange={(e) => setEditedFeedback({ ...editedFeedback, www: e.target.value })}
                        data-testid="edit-www-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Steps</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        value={editedFeedback.next_steps || ''}
                        onChange={(e) => setEditedFeedback({ ...editedFeedback, next_steps: e.target.value })}
                        data-testid="edit-next-steps-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overall Feedback</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        value={editedFeedback.overall_feedback || ''}
                        onChange={(e) => setEditedFeedback({ ...editedFeedback, overall_feedback: e.target.value })}
                        data-testid="edit-overall-feedback-input"
                      />
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <p className="text-gray-600 text-sm mb-1">Score</p>
                      <p className="text-3xl font-bold text-blue-600" data-testid="score">{data.submission.score}/{data.question.max_marks}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">What Went Well</h3>
                      <p className="text-gray-700" data-testid="www">{data.submission.www}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Next Steps</h3>
                      <p className="text-gray-700" data-testid="next-steps">{data.submission.next_steps}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Feedback</h3>
                      <p className="text-gray-700" data-testid="overall-feedback">{data.submission.overall_feedback}</p>
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
      const response = await axios.get(`${API}/teacher/assessments/${assessmentId}/security-report`);
      setReport(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading security report:', error);
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'tab_hidden':
        return '👁️';
      case 'window_blur':
        return '🔄';
      case 'fullscreen_exit':
        return '⬜';
      case 'fullscreen_not_supported':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const getEventLabel = (eventType) => {
    switch (eventType) {
      case 'tab_hidden':
        return 'Tab Switch';
      case 'window_blur':
        return 'Window Lost Focus';
      case 'fullscreen_exit':
        return 'Exited Fullscreen';
      case 'fullscreen_not_supported':
        return 'Fullscreen Not Supported';
      default:
        return eventType;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!report) {
    return <div className="flex items-center justify-center min-h-screen">Report not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <button onClick={() => navigate(`/teacher/assessments/${assessmentId}`)} className="text-gray-700 hover:text-blue-600">← Back to Assessment</button>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="security-report-title">Security Report</h2>
          <p className="text-gray-600">Monitor student activity during the assessment</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-600">{report.total_submissions}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">With Security Events</p>
            <p className="text-3xl font-bold text-yellow-600">{report.submissions_with_events}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Total Events</p>
            <p className="text-3xl font-bold text-orange-600">{report.total_events}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-1">Flagged (3+ events)</p>
            <p className="text-3xl font-bold text-red-600">{report.flagged_count}</p>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">Student Activity</h3>
          </div>
          
          {report.report.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium">No security events detected</p>
              <p className="text-sm text-gray-500">All students completed the assessment without any flagged activity</p>
            </div>
          ) : (
            <div className="divide-y">
              {report.report.map((student) => (
                <div 
                  key={student.attempt_id} 
                  className={`p-6 ${student.flagged ? 'bg-red-50' : ''}`}
                  data-testid={`security-student-${student.attempt_id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{student.student_name}</h4>
                        {student.flagged && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                            FLAGGED
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          student.status === 'marked' ? 'bg-green-100 text-green-700' : 
                          student.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                      
                      {/* Event Summary */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {Object.entries(student.event_summary).map(([type, count]) => (
                          count > 0 && (
                            <div key={type} className="flex items-center gap-1">
                              <span>{getEventIcon(type)}</span>
                              <span className="text-gray-600">{getEventLabel(type)}:</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{student.event_count}</p>
                        <p className="text-xs text-gray-500">events</p>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(selectedStudent === student.attempt_id ? null : student.attempt_id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {selectedStudent === student.attempt_id ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Event Details */}
                  {selectedStudent === student.attempt_id && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Event Timeline</h5>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {student.events.map((event, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <span className="text-gray-400 w-20">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                            <span>{getEventIcon(event.type)}</span>
                            <span className="text-gray-700">{getEventLabel(event.type)}</span>
                          </div>
                        ))}
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

// Teacher Profile Page
export const ProfilePage = ({ user, onProfileUpdate }) => {
  const [profile, setProfile] = useState({
    name: user.name || '',
    display_name: user.display_name || '',
    school_name: user.school_name || '',
    department: user.department || ''
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [questionsRes, assessmentsRes, classesRes] = await Promise.all([
        axios.get(`${API}/teacher/questions`),
        axios.get(`${API}/teacher/assessments`),
        axios.get(`${API}/teacher/classes`)
      ]);
      
      // Calculate stats
      const totalQuestions = questionsRes.data.length;
      const totalAssessments = assessmentsRes.data.length;
      const totalClasses = (classesRes.data.classes || []).length;
      const activeAssessments = assessmentsRes.data.filter(a => a.status === 'started').length;
      
      setStats({
        totalQuestions,
        totalAssessments,
        totalClasses,
        activeAssessments
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/auth/profile`, profile);
      alert('Profile updated successfully!');
      if (onProfileUpdate) {
        onProfileUpdate({ ...user, ...profile });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <button onClick={() => navigate('/teacher')} className="text-gray-700 hover:text-blue-600">← Back to Dashboard</button>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-6" data-testid="profile-title">Profile Settings</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  data-testid="profile-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name (shown on reports)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="e.g., Mr. Smith, Ms. Johnson"
                  data-testid="profile-display-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profile.school_name}
                  onChange={(e) => setProfile({ ...profile, school_name: e.target.value })}
                  data-testid="profile-school-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  placeholder="e.g., Science, Mathematics"
                  data-testid="profile-department-input"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  data-testid="save-profile-btn"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Role:</span> {user.role}</p>
                <p><span className="font-medium">Auth Provider:</span> {user.auth_provider || 'Email'}</p>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
              {stats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Questions Created</span>
                    <span className="text-2xl font-bold text-blue-600" data-testid="stat-questions">{stats.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Assessments</span>
                    <span className="text-2xl font-bold text-green-600" data-testid="stat-assessments">{stats.totalAssessments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Assessments</span>
                    <span className="text-2xl font-bold text-amber-600" data-testid="stat-active">{stats.activeAssessments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Classes</span>
                    <span className="text-2xl font-bold text-purple-600" data-testid="stat-classes">{stats.totalClasses}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading stats...</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-lg shadow text-white">
              <h3 className="font-semibold mb-2">Quick Tips</h3>
              <ul className="text-sm space-y-2 text-blue-100">
                <li>• Set your display name for professional PDF reports</li>
                <li>• Add your school name to personalize feedback</li>
                <li>• Link assessments to classes for better tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
