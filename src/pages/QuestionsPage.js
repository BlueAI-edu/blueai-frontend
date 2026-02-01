import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import MathKeyboard from '../components/MathKeyboard';
import LaTeXRenderer from '../components/LaTeXRenderer';
import QuestionBank from '../components/QuestionBank';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export const QuestionsPage = ({ user }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manual'); // manual, ai, bank
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    exam_type: '',
    topic: '',
    question_text: '',
    max_marks: '',
    mark_scheme: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await axios.get(`${API}/teacher/questions`);
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoading(false);
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
      setFormData({ subject: '', exam_type: '', topic: '', question_text: '', max_marks: '', mark_scheme: '' });
      loadQuestions();
    } catch (error) {
      alert('Failed to save question');
    }
  };

  const handleEdit = (question) => {
    setFormData({
      subject: question.subject,
      exam_type: question.exam_type,
      topic: question.topic,
      question_text: question.question_text,
      max_marks: question.max_marks.toString(),
      mark_scheme: question.mark_scheme
    });
    setEditingId(question.id);
    setShowForm(true);
    setActiveTab('manual'); // Switch to manual tab for editing
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    
    try {
      await axios.delete(`${API}/teacher/questions/${id}`);
      loadQuestions();
    } catch (error) {
      alert('Failed to delete question');
    }
  };

  const openMathKeyboard = (field) => {
    setActiveField(field);
    setShowMathKeyboard(true);
  };

  const insertMath = (latex) => {
    if (activeField) {
      setFormData(prev => ({
        ...prev,
        [activeField]: prev[activeField] + latex
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <div className="flex gap-4">
              <button onClick={() => navigate('/teacher/dashboard')} className="text-gray-700 hover:text-blue-600">Dashboard</button>
              <button onClick={() => navigate('/teacher/questions')} className="text-blue-600 font-medium">Questions</button>
              <button onClick={() => navigate('/teacher/assessments')} className="text-gray-700 hover:text-blue-600">Assessments</button>
              <button onClick={() => navigate('/teacher/classes')} className="text-gray-700 hover:text-blue-600">Classes</button>
              <button onClick={() => navigate('/teacher/analytics')} className="text-gray-700 hover:text-blue-600">Analytics</button>
              {user.role === 'admin' && <button onClick={() => navigate('/admin/dashboard')} className="text-gray-700 hover:text-blue-600">Admin</button>}
            </div>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="questions-title">Question Builder</h2>
          <p className="text-gray-600">Create questions manually or use AI to generate curriculum-aligned questions</p>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-3 font-medium border-b-2 ${
                activeTab === 'manual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
              data-testid="manual-tab"
            >
              📝 Manual Builder
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 font-medium border-b-2 ${
                activeTab === 'ai'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
              data-testid="ai-tab"
            >
              🤖 AI Generator
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-6 py-3 font-medium border-b-2 ${
                activeTab === 'bank'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
              data-testid="bank-tab"
            >
              🗂️ Question Bank ({questions.length})
            </button>
          </div>
        </div>

        {/* Manual Builder Tab */}
        {activeTab === 'manual' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Manual Question Builder</h3>
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setFormData({ subject: '', exam_type: '', topic: '', question_text: '', max_marks: '', mark_scheme: '' }); }}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                data-testid="new-question-btn"
              >
                + New Question
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-6" data-testid="question-form">
                <h3 className="text-xl font-semibold mb-4">{editingId ? 'Edit Question' : 'Create Question'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        data-testid="subject-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={formData.exam_type}
                        onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                        placeholder="e.g., GCSE, A-Level"
                        required
                        data-testid="exam-type-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border rounded-lg"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        required
                        data-testid="topic-input"
                      />
                      <button
                        type="button"
                        onClick={() => openMathKeyboard('topic')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        title="Math Keyboard"
                      >
                        𝑓(𝑥)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <div className="relative">
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows="4"
                        value={formData.question_text}
                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                        required
                        data-testid="question-text-input"
                      />
                      <button
                        type="button"
                        onClick={() => openMathKeyboard('question_text')}
                        className="absolute top-2 right-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        title="Math Keyboard"
                      >
                        𝑓(𝑥)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mark Scheme</label>
                    <div className="relative">
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg"
                        rows="6"
                        value={formData.mark_scheme}
                        onChange={(e) => setFormData({ ...formData, mark_scheme: e.target.value })}
                        placeholder="Enter marking criteria"
                        required
                        data-testid="mark-scheme-input"
                      />
                      <button
                        type="button"
                        onClick={() => openMathKeyboard('mark_scheme')}
                        className="absolute top-2 right-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        title="Math Keyboard"
                      >
                        𝑓(𝑥)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.max_marks}
                      onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                      required
                      min="1"
                      data-testid="max-marks-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700" data-testid="save-question-btn">
                      {editingId ? 'Update' : 'Create'} Question
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" data-testid="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showForm && (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-600 mb-4">Click "New Question" to create a question manually with full control over content and formatting.</p>
                <p className="text-sm text-gray-500">Math keyboard available for LaTeX support in all text fields.</p>
              </div>
            )}
          </div>
        )}

        {/* AI Generator Tab */}
        {activeTab === 'ai' && (
          <AIQuestionGenerator user={user} onQuestionsGenerated={loadQuestions} />
        )}

        {/* Question Bank Tab */}
        {activeTab === 'bank' && (
          <QuestionBank
            user={user}
            questions={questions}
            onRefresh={loadQuestions}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Math Keyboard Modal */}
      {showMathKeyboard && (
        <MathKeyboard
          onInsert={insertMath}
          onClose={() => setShowMathKeyboard(false)}
        />
      )}
    </div>
  );
};

