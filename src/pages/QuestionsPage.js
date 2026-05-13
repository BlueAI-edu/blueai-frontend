import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Edit3,
  Eye,
  FileQuestion,
  FileScan,
  Files,
  HelpCircle,
  Import,
  Layers3,
  Lightbulb,
  MoreHorizontal,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  Trash2,
} from 'lucide-react';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import MixedMathEditor from '../components/MixedMathEditor';
import QuestionBank from '../components/QuestionBank';
import { Navbar } from '../components/Navbar';
import { API } from '@/config';
import { handleApiError, showSuccess } from '@/lib/handle-error';

const blankFormData = {
  subject: '',
  exam_type: '',
  topic: '',
  question_text: '',
  max_marks: '',
  mark_scheme: ''
};

const tabCopy = {
  manual: {
    label: 'Manual Builder',
    description: 'Write from scratch with full control over content, mark scheme, metadata, and formatting.',
    icon: PenLine,
  },
  ai: {
    label: 'AI Generator',
    description: 'Generate by subject, topic, level, mark type, and exam context, then review before saving.',
    icon: Bot,
  },
  bank: {
    label: 'Question Bank',
    description: 'Browse, reuse, adapt, and organise saved questions by topic, type, and assessment need.',
    icon: Banknote,
  },
  templates: {
    label: 'Templates',
    description: 'Start from common assessment item patterns and planned reusable structures.',
    icon: Layers3,
  },
};

const statusStyles = {
  Draft: 'bg-amber-50 text-amber-700 border-amber-200',
  Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Reviewed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Bank': 'bg-blue-50 text-blue-700 border-blue-200',
};

const getQuestionTitle = (question) => {
  if (question.question_title) return question.question_title;
  if (question.topic) return question.topic;
  const text = question.question_text || 'Untitled question';
  return text.length > 72 ? `${text.slice(0, 72)}...` : text;
};

const getQuestionType = (question) => {
  const type = question.answer_type || question.question_type || 'text';
  const labels = {
    mcq: 'Multiple Choice',
    multiple_choice: 'Multiple Choice',
    short: 'Short Answer',
    text: 'Short Answer',
    maths: 'Structured',
    numeric: 'Structured',
    mixed: 'Structured',
    extended: 'Extended Answer',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const getQuestionStatus = (question) => {
  if (question.status) return question.status;
  if (!question.mark_scheme) return 'Draft';
  if (question.quality_score >= 80) return 'Reviewed';
  if (question.source === 'ai') return 'Published';
  return 'In Bank';
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
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
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
  const fileInputRef = useRef(null);
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

  const handleImportQuestion = () => {
    setImportMessage('');
    fileInputRef.current?.click();
  };

  const goToOcrUpload = () => {
    navigate('/teacher/ocr-upload');
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    setImportMessage('');
    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('File must be valid JSON (a single question object or an array of questions).');
      }

      const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.questions) ? parsed.questions : [parsed];
      if (items.length === 0) throw new Error('No questions found in the selected file.');

      let imported = 0;
      const failures = [];
      for (const raw of items) {
        if (!raw || typeof raw !== 'object') continue;
        const payload = {
          subject: raw.subject || raw.Subject || '',
          exam_type: raw.exam_type || raw.examType || raw.exam || '',
          topic: raw.topic || raw.Topic || '',
          question_text: raw.question_text || raw.questionText || raw.text || raw.question || '',
          mark_scheme: raw.mark_scheme || raw.markScheme || raw.scheme || '',
          max_marks: parseInt(raw.max_marks ?? raw.maxMarks ?? raw.marks ?? 1, 10) || 1,
        };
        if (!payload.subject || !payload.exam_type || !payload.topic || !payload.question_text) {
          failures.push(payload.topic || payload.question_text?.slice(0, 40) || 'Untitled');
          continue;
        }
        try {
          await axios.post(`${API}/teacher/questions`, payload);
          imported += 1;
        } catch {
          failures.push(payload.topic || 'Untitled');
        }
      }

      if (imported > 0) {
        showSuccess(`Imported ${imported} question${imported === 1 ? '' : 's'}.`);
        loadQuestions();
      }
      if (failures.length > 0) {
        setImportMessage(`${imported} imported, ${failures.length} skipped (missing required fields: subject, exam_type, topic, question_text).`);
      } else if (imported === 0) {
        setImportMessage('No valid questions were imported.');
      }
    } catch (error) {
      setImportMessage(error.message || 'Failed to import file.');
    } finally {
      setImporting(false);
    }
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
  const draftQuestions = questions.filter((question) => getQuestionStatus(question) === 'Draft');
  const aiGenerated = questions.filter((question) => question.source === 'ai');
  const bankedQuestions = questions.filter((question) => getQuestionStatus(question) !== 'Draft');

  const stats = [
    {
      label: 'Total Questions',
      value: questions.length,
      helper: 'All authored and saved items',
      icon: FileQuestion,
      action: () => goToTab('bank'),
    },
    {
      label: 'AI Generated',
      value: aiGenerated.length,
      helper: 'Generated and ready to review',
      icon: Bot,
      action: () => goToTab('ai'),
    },
    {
      label: 'Question Bank',
      value: bankedQuestions.length,
      helper: 'Reusable items available',
      icon: Banknote,
      action: () => goToTab('bank'),
    },
    {
      label: 'Drafts',
      value: draftQuestions.length,
      helper: 'Questions needing completion',
      icon: Files,
      action: () => goToTab('manual'),
    },
  ];

  const routeCards = [
    {
      title: 'Manual Builder',
      description: 'Write from scratch, add equations, mark scheme, marks, and metadata with full control.',
      icon: PenLine,
      actionLabel: 'Start writing',
      onClick: startManualQuestion,
      active: activeTab === 'manual',
    },
    {
      title: 'AI Generator',
      description: 'Generate assessment-ready ideas by topic, level, difficulty, mark type, and context.',
      icon: Sparkles,
      actionLabel: 'Generate with AI',
      onClick: () => goToTab('ai'),
      active: activeTab === 'ai',
    },
    {
      title: 'Question Bank',
      description: 'Browse saved items, reuse previous questions, and adapt banked content for new assessments.',
      icon: Banknote,
      actionLabel: 'Browse bank',
      onClick: () => goToTab('bank'),
      active: activeTab === 'bank',
    },
    {
      title: 'OCR Import',
      description: 'Extract questions from exam papers or structured source content, then review and adapt.',
      icon: FileScan,
      actionLabel: 'Open OCR tool',
      onClick: goToOcrUpload,
      active: false,
      badge: 'Available',
    },
  ];

  const workflowSteps = [
    { title: 'Choose builder mode', detail: 'Manual, AI, bank reuse, or import.', action: () => goToTab('manual') },
    { title: 'Create or generate question', detail: 'Draft the item and answer expectations.', action: startManualQuestion },
    { title: 'Add mark scheme / metadata', detail: 'Set marks, subject, topic, tags, and difficulty.', action: startManualQuestion },
    { title: 'Save, reuse, or deploy', detail: 'Bank the item or use it in an assessment.', action: () => goToTab('bank') },
  ];

  const tips = [
    { icon: Sparkles, text: 'Use AI for inspiration, then edit wording and mark scheme before publishing.' },
    { icon: Tags, text: 'Tag by topic, type, and skill so questions are easy to search and reuse later.' },
    { icon: ClipboardCheck, text: 'Review marks, accepted answers, and command words before using in assessment.' },
    { icon: HelpCircle, text: 'Use equation and formatting tools where mathematical notation matters.' },
  ];

  const questionTypes = [
    { label: 'Multiple Choice', helper: 'Fast checks', icon: CheckCircle2 },
    { label: 'Short Answer', helper: 'Focused recall', icon: PenLine },
    { label: 'Structured', helper: 'Multi-step marks', icon: Layers3 },
    { label: 'Extended Answer', helper: 'Reasoning depth', icon: BookOpenCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
            <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_260px] lg:p-8">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <FileQuestion className="h-4 w-4" />
                  Question authoring workspace
                </div>
                <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl" data-testid="questions-title">Question Builder</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Create, generate, import, organise, and reuse assessment-ready questions from one teacher-friendly hub.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={startManualQuestion}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    data-testid="new-question-btn"
                  >
                    <Plus className="h-4 w-4" />
                    New Question
                  </button>
                  <button
                    onClick={handleImportQuestion}
                    disabled={importing}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
                    {importing ? 'Importing…' : 'Import Question'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={handleImportFileChange}
                  />
                </div>
                {importMessage && (
                  <p className="mt-3 text-xs text-slate-600">{importMessage}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Import a <code className="rounded bg-slate-100 px-1 py-0.5">.json</code> file (single question or array). Fields: subject, exam_type, topic, question_text, mark_scheme, max_marks.
                  {' '}Need to scan a paper instead?{' '}
                  <button onClick={goToOcrUpload} className="font-semibold text-blue-700 hover:text-blue-800">Use OCR upload</button>.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-blue-600 p-3 text-white">
                    <Search className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">Reuse-ready</span>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 rounded-md bg-white p-3 shadow-sm">
                    <Tags className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Tag by topic and type</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-md bg-white p-3 shadow-sm">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">Add mark scheme</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-md bg-white p-3 shadow-sm">
                    <Banknote className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-slate-700">Save to bank</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">Workflow</h2>
                <p className="text-sm text-slate-500">Choose mode, create or generate, add metadata and mark scheme, then save, reuse, or deploy.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {workflowSteps.map((step, index) => (
                <button
                  key={step.title}
                  onClick={step.action}
                  className="flex w-full items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-left hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-700 shadow-sm">{index + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{step.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{step.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <SkeletonBlock className="h-5 w-24" />
                <SkeletonBlock className="mt-5 h-8 w-14" />
                <SkeletonBlock className="mt-4 h-4 w-36" />
              </div>
            ))
          ) : (
            stats.map(({ label, value, helper, icon: Icon, action }) => (
              <button
                key={label}
                onClick={action}
                className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">{label}</span>
                  <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{helper}</p>
              </button>
            ))
          )}
        </section>

        {loadError && (
          <div className="mt-5">
            <SectionError title="Question data unavailable" message={loadError} onRetry={loadQuestions} />
          </div>
        )}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex gap-2 overflow-x-auto">
            {Object.entries(tabCopy).map(([key, tab]) => {
              const Icon = tab.icon;
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => goToTab(key)}
                  className={`flex min-w-[190px] items-center gap-3 rounded-md px-4 py-3 text-left transition ${
                    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  data-testid={`${key}-tab`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {tab.label}
                      {key === 'bank' && (
                        <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'}`}>
                          {questions.length}
                        </span>
                      )}
                    </span>
                    <span className={`mt-0.5 line-clamp-1 block text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Quick Start</h2>
                  <p className="mt-1 text-sm text-slate-500">Pick the route that best fits the question you need to create or reuse.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 p-4">
                      <SkeletonBlock className="h-10 w-10" />
                      <SkeletonBlock className="mt-4 h-5 w-36" />
                      <SkeletonBlock className="mt-3 h-4 w-full" />
                      <SkeletonBlock className="mt-2 h-4 w-3/4" />
                    </div>
                  ))
                ) : (
                  routeCards.map(({ title, description, icon: Icon, actionLabel, onClick, active, badge }) => (
                    <button
                      key={title}
                      onClick={onClick}
                      className={`group rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                        active ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`rounded-lg p-2 ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700'}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        {badge && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{badge}</span>}
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
                      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">{description}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                        {actionLabel}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            {activeTab === 'manual' && (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Manual Builder</h2>
                    <p className="mt-1 text-sm text-slate-500">Create questions with content, metadata, marks, and mark scheme in one pass.</p>
                  </div>
                  {!showForm && (
                    <button
                      onClick={startManualQuestion}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      New Question
                    </button>
                  )}
                </div>

                {showForm ? (
                  <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5" data-testid="question-form">
                    <h3 className="text-lg font-semibold text-slate-950">{editingId ? 'Edit Question' : 'Create Question'}</h3>
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
                      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                        <div>
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
                        <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                          Add marks and mark scheme before saving so the item is ready for reuse in assessments.
                        </div>
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
                  <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <PenLine className="mx-auto h-9 w-9 text-blue-600" />
                    <h3 className="mt-3 font-semibold text-slate-950">Ready for a new manual question</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      Start with the question, add marks and a mark scheme, then save it into your reusable question bank.
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
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">AI Generator</h2>
                    <p className="text-sm text-slate-500">Generate, review, select, and save questions into your bank.</p>
                  </div>
                </div>
                <AIQuestionGenerator user={user} onQuestionsGenerated={loadQuestions} />
              </section>
            )}

            {activeTab === 'bank' && (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                {questions.length === 0 && !loading ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Banknote className="mx-auto h-9 w-9 text-blue-600" />
                    <h3 className="mt-3 font-semibold text-slate-950">No question bank items yet</h3>
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
                    <h2 className="text-xl font-bold text-slate-950">Assessment Templates</h2>
                    <p className="mt-1 text-sm text-slate-500">Reusable assessment patterns built on a saved question. Spin up new assessments in one click.</p>
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

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Recent Questions</h2>
                  <p className="mt-1 text-sm text-slate-500">Continue editing, preview, duplicate, or open saved questions.</p>
                </div>
                <button onClick={() => goToTab('bank')} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
                  View all questions
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonBlock key={index} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentQuestions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <FileQuestion className="mx-auto h-9 w-9 text-blue-600" />
                    <h3 className="mt-3 font-semibold text-slate-950">No recent questions yet</h3>
                    <p className="mt-2 text-sm text-slate-500">Create a question and it will appear here for quick access.</p>
                    <button onClick={startManualQuestion} className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      Create New Question
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="hidden grid-cols-[minmax(0,1.4fr)_100px_100px_90px_100px_minmax(160px,auto)] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 xl:grid">
                      <span>Question title</span>
                      <span>Type</span>
                      <span>Subject</span>
                      <span>Status</span>
                      <span>Updated</span>
                      <span>Actions</span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {recentQuestions.map((question) => {
                        const status = getQuestionStatus(question);
                        return (
                          <div
                            key={question.id}
                            className="grid gap-3 px-4 py-4 hover:bg-slate-50 xl:grid-cols-[minmax(0,1.4fr)_100px_100px_90px_100px_minmax(160px,auto)] xl:items-center"
                          >
                            <button onClick={() => handleEdit(question)} className="min-w-0 text-left">
                              <span className="block truncate font-semibold text-slate-950">{getQuestionTitle(question)}</span>
                              <span className="mt-1 block text-sm text-slate-500 xl:hidden">{question.subject || 'Subject'} · {getQuestionType(question)} · {formatUpdatedDate(question)}</span>
                            </button>
                            <span className="hidden truncate text-sm text-slate-600 xl:block">{getQuestionType(question)}</span>
                            <span className="hidden truncate text-sm text-slate-600 xl:block">{question.subject || 'Subject'}</span>
                            <span>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles['In Bank']}`}>
                                {status}
                              </span>
                            </span>
                            <span className="hidden truncate text-sm text-slate-500 xl:block">{formatUpdatedDate(question)}</span>
                            <div className="flex items-center gap-1 xl:justify-start">
                              <button onClick={() => handleEdit(question)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="Open/edit">
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button onClick={() => goToTab('bank')} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="Preview in bank">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDuplicate(question)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="Duplicate">
                                <Copy className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(question.id)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title="More actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-950">Builder Tips</h2>
                  <p className="text-sm text-slate-500">Quality checks for assessment-ready items.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-14 w-full" />)
                ) : (
                  tips.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <p className="text-sm leading-6 text-slate-600">{text}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">Popular Question Types</h2>
              <p className="mt-1 text-sm text-slate-500">Common formats teachers can author, generate, and reuse.</p>
              <div className="mt-5 grid gap-3">
                {questionTypes.map(({ label, helper, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={startManualQuestion}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-blue-700" />
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{label}</span>
                        <span className="block text-xs text-slate-500">{helper}</span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">Organisation</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p className="rounded-lg bg-slate-50 p-3">Save strong questions to the bank so they can be reused across assessments.</p>
                <p className="rounded-lg bg-slate-50 p-3">Use tags, topics, and question type labels to keep search and reuse fast.</p>
                {draftQuestions.length === 0 ? (
                  <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">No drafts need attention right now.</p>
                ) : (
                  <button onClick={() => goToTab('manual')} className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-left font-medium text-amber-800">
                    {draftQuestions.length} draft{draftQuestions.length === 1 ? '' : 's'} need mark scheme or metadata review.
                  </button>
                )}
                {bankedQuestions.length === 0 && !loading && (
                  <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-700">No banked items yet. Save created questions into the bank for future reuse.</p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
