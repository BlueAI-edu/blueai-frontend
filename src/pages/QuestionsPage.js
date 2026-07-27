import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Bot,
  Copy,
  Edit3,
  FileQuestion,
  Layers3,
  PenLine,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import MixedMathEditor from '../components/MixedMathEditor';
import QuestionBank from '../components/QuestionBank';
import { Navbar } from '../components/Navbar';
import { API } from '@/config';
import { handleApiError, showSuccess } from '@/lib/handle-error';

/**
 * Questions tab — a working surface, not a brochure. Header + tabs + the
 * active tool. The old hero/stats/workflow/tips panels were removed: they
 * described the page instead of doing anything.
 */

const blankFormData = {
  subject: '',
  exam_type: '',
  topic: '',
  question_text: '',
  max_marks: '',
  mark_scheme: ''
};

const tabs = [
  { key: 'manual', label: 'Manual Builder', icon: PenLine },
  { key: 'ai', label: 'AI Generator', icon: Bot },
  { key: 'bank', label: 'Question Bank', icon: Banknote },
  { key: 'templates', label: 'Templates', icon: Layers3 },
];

const getQuestionTitle = (question) => {
  if (question.question_title) return question.question_title;
  if (question.topic) return question.topic;
  const text = question.question_text || 'Untitled question';
  return text.length > 72 ? `${text.slice(0, 72)}...` : text;
};

const formatUpdatedDate = (question) => {
  const value = question.updated_at || question.created_at;
  if (!value) return 'Recently';
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Recently';
  }
};

const SectionError = ({ title, message, onRetry }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    <div className="flex items-start gap-3">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-red-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  </div>
);

const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
);

export const QuestionsPage = ({ user }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(blankFormData);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    question_id: '',
    duration_minutes: '',
    auto_close: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates();
    }
  }, [activeTab]);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError('');
    try {
      const response = await axios.get(`${API}/teacher/templates`);
      setTemplates(response.data.templates || []);
    } catch {
      setTemplatesError('Could not load templates. Try again.');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const openTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      question_id: questions[0]?.id || '',
      duration_minutes: '',
      auto_close: false,
    });
    setShowTemplateForm(true);
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.name.trim() || !templateForm.question_id) return;
    setSavingTemplate(true);
    try {
      await axios.post(`${API}/teacher/templates`, {
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || null,
        question_id: templateForm.question_id,
        duration_minutes: templateForm.duration_minutes ? parseInt(templateForm.duration_minutes, 10) : null,
        auto_close: templateForm.auto_close,
      });
      showSuccess('Template created.');
      setShowTemplateForm(false);
      loadTemplates();
    } catch (error) {
      handleApiError(error, 'Failed to create template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await axios.delete(`${API}/teacher/templates/${templateId}`);
      loadTemplates();
    } catch (error) {
      handleApiError(error, 'Failed to delete template');
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await axios.get(`${API}/teacher/questions`);
      setQuestions(response.data);
    } catch {
      setLoadError('Question data could not be loaded. You can still start a new question.');
    } finally {
      setLoading(false);
    }
  };

  const startManualQuestion = () => {
    setActiveTab('manual');
    setShowForm(true);
    setEditingId(null);
    setFormData(blankFormData);
  };

  const goToTab = (tab) => {
    setActiveTab(tab);
    if (tab !== 'manual') setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(`${API}/teacher/questions/${editingId}`, {
          ...formData,
          max_marks: parseInt(formData.max_marks)
        });
      } else {
        await axios.post(`${API}/teacher/questions`, {
          ...formData,
          max_marks: parseInt(formData.max_marks)
        });
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(blankFormData);
      loadQuestions();
    } catch (error) {
      handleApiError(error, 'Failed to save question');
    }
  };

  const handleEdit = (question) => {
    setFormData({
      subject: question.subject || '',
      exam_type: question.exam_type || '',
      topic: question.topic || '',
      question_text: question.question_text || '',
      max_marks: question.max_marks?.toString() || '',
      mark_scheme: question.mark_scheme || ''
    });
    setEditingId(question.id);
    setShowForm(true);
    setActiveTab('manual');
  };

  const handleDuplicate = (question) => {
    setFormData({
      subject: question.subject || '',
      exam_type: question.exam_type || '',
      topic: question.topic ? `${question.topic} copy` : '',
      question_text: question.question_text || '',
      max_marks: question.max_marks?.toString() || '',
      mark_scheme: question.mark_scheme || ''
    });
    setEditingId(null);
    setShowForm(true);
    setActiveTab('manual');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;

    try {
      await axios.delete(`${API}/teacher/questions/${id}`);
      loadQuestions();
    } catch (error) {
      handleApiError(error, 'Failed to delete question');
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
    const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });
  const recentQuestions = sortedQuestions.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950" data-testid="questions-title">Questions</h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? 'Loading your question bank…' : `${questions.length} question${questions.length !== 1 ? 's' : ''} in your bank.`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={startManualQuestion}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              data-testid="new-question-btn"
            >
              <Plus className="h-4 w-4" />
              New Question
            </button>
            <button
              onClick={() => goToTab('ai')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              Generate with AI
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mt-5">
            <SectionError title="Question data unavailable" message={loadError} onRetry={loadQuestions} />
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="mt-6 flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => goToTab(key)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
                data-testid={`${key}-tab`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {key === 'bank' && !loading && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'}`}>
                    {questions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Active tab content ── */}
        <div className="mt-5 space-y-5">

          {activeTab === 'manual' && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              {showForm ? (
                <div data-testid="question-form">
                  <h2 className="text-lg font-semibold text-slate-950">{editingId ? 'Edit Question' : 'Create Question'}</h2>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                        <input
                          type="text"
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                          data-testid="subject-input"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Exam Type</label>
                        <input
                          type="text"
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          value={formData.exam_type}
                          onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                          placeholder="e.g., GCSE, A-Level"
                          required
                          data-testid="exam-type-input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Topic</label>
                      <MixedMathEditor
                        value={formData.topic}
                        onChange={(v) => setFormData({ ...formData, topic: v })}
                        placeholder="e.g., Quadratic equations"
                        rows={1}
                        required
                        data-testid="topic-input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Question Text</label>
                      <MixedMathEditor
                        value={formData.question_text}
                        onChange={(v) => setFormData({ ...formData, question_text: v })}
                        placeholder="Enter your question here..."
                        rows={4}
                        required
                        data-testid="question-text-input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Mark Scheme</label>
                      <MixedMathEditor
                        value={formData.mark_scheme}
                        onChange={(v) => setFormData({ ...formData, mark_scheme: v })}
                        placeholder="Enter marking criteria..."
                        rows={5}
                        required
                        data-testid="mark-scheme-input"
                      />
                    </div>
                    <div className="max-w-[180px]">
                      <label className="mb-1 block text-sm font-medium text-slate-700">Max Marks</label>
                      <input
                        type="number"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={formData.max_marks}
                        onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                        required
                        min="1"
                        data-testid="max-marks-input"
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" data-testid="save-question-btn">
                        {editingId ? 'Update' : 'Create'} Question
                      </button>
                      <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" data-testid="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <PenLine className="mx-auto h-9 w-9 text-blue-600" />
                  <h2 className="mt-3 font-semibold text-slate-950">Write a new question</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Add the question, marks, and a mark scheme — it saves straight into your bank for reuse.
                  </p>
                  <button
                    onClick={startManualQuestion}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Question
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'ai' && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <AIQuestionGenerator user={user} onQuestionsGenerated={loadQuestions} />
            </section>
          )}

          {activeTab === 'bank' && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              {questions.length === 0 && !loading ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <Banknote className="mx-auto h-9 w-9 text-blue-600" />
                  <h2 className="mt-3 font-semibold text-slate-950">No question bank items yet</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Save created or generated questions here so you can reuse and adapt them across assessments.
                  </p>
                  <button
                    onClick={startManualQuestion}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Question
                  </button>
                </div>
              ) : (
                <QuestionBank
                  user={user}
                  questions={questions}
                  onRefresh={loadQuestions}
                  onEdit={handleEdit}
                />
              )}
            </section>
          )}

          {activeTab === 'templates' && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Assessment Templates</h2>
                  <p className="mt-1 text-sm text-slate-500">Reusable assessment patterns built on a saved question.</p>
                </div>
                <button
                  onClick={openTemplateForm}
                  disabled={questions.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  title={questions.length === 0 ? 'Create a question first' : 'New template'}
                >
                  <Plus className="h-4 w-4" />
                  New Template
                </button>
              </div>

              {questions.length === 0 && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Templates wrap an existing question. Create at least one question first, then come back to build a template from it.
                </div>
              )}

              {templatesError && (
                <div className="mt-4">
                  <SectionError title="Templates unavailable" message={templatesError} onRetry={loadTemplates} />
                </div>
              )}

              {showTemplateForm && (
                <form onSubmit={handleCreateTemplate} className="mt-5 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Create Template</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Template name</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        required
                        maxLength={500}
                        placeholder="e.g., Quadratics quick check"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Question</label>
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={templateForm.question_id}
                        onChange={(e) => setTemplateForm({ ...templateForm, question_id: e.target.value })}
                        required
                      >
                        <option value="" disabled>Choose a question</option>
                        {questions.map((q) => (
                          <option key={q.id} value={q.id}>
                            {(q.topic || getQuestionTitle(q)).slice(0, 80)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
                    <textarea
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      rows={2}
                      maxLength={2000}
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                      placeholder="When to reuse this template"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Duration (mins)</label>
                      <input
                        type="number"
                        min="1"
                        max="600"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={templateForm.duration_minutes}
                        onChange={(e) => setTemplateForm({ ...templateForm, duration_minutes: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <label className="flex items-center gap-2 self-end text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={templateForm.auto_close}
                        onChange={(e) => setTemplateForm({ ...templateForm, auto_close: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Auto-close when duration elapses
                    </label>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="submit" disabled={savingTemplate} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
                      {savingTemplate ? 'Saving…' : 'Create Template'}
                    </button>
                    <button type="button" onClick={() => setShowTemplateForm(false)} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5">
                {templatesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-20 w-full" />)}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Layers3 className="mx-auto h-9 w-9 text-blue-600" />
                    <h3 className="mt-3 font-semibold text-slate-950">No templates yet</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      Build a template from a saved question to launch the same assessment configuration again and again.
                    </p>
                    {questions.length > 0 && (
                      <button onClick={openTemplateForm} className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        Create First Template
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {templates.map((t) => (
                      <div key={t.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="truncate font-semibold text-slate-950">{t.name}</h4>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {t.question_subject || 'Subject'}{t.question_topic ? ` · ${t.question_topic}` : ''}
                            </p>
                          </div>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete template">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {t.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{t.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          {t.duration_minutes && <span className="rounded-full bg-slate-100 px-2 py-0.5">{t.duration_minutes} min</span>}
                          {t.auto_close && <span className="rounded-full bg-slate-100 px-2 py-0.5">Auto-close</span>}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">Used {t.use_count || 0}×</span>
                        </div>
                        <button
                          onClick={() => navigate('/teacher/assessments')}
                          className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Use in assessments
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Recent questions — shown on the manual tab as a quick "continue where
              you left off" list. The bank tab already lists everything. */}
          {activeTab === 'manual' && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">Recent questions</h2>
                <button onClick={() => goToTab('bank')} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonBlock key={index} className="h-14 w-full" />
                    ))}
                  </div>
                ) : recentQuestions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <FileQuestion className="mx-auto h-8 w-8 text-blue-600" />
                    <p className="mt-2 text-sm text-slate-500">Questions you create will appear here for quick access.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentQuestions.map((question) => (
                      <div key={question.id} className="flex items-center gap-3 py-3">
                        <button onClick={() => handleEdit(question)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm font-semibold text-slate-950">{getQuestionTitle(question)}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {question.subject || 'Subject'} · {question.max_marks ?? '—'} marks · {formatUpdatedDate(question)}
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <button onClick={() => handleEdit(question)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDuplicate(question)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="Duplicate">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(question.id)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};
