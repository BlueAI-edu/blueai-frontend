import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AssessmentModeSelector from '../components/EnhancedAssessmentBuilder/AssessmentModeSelector';
import QuestionEditor from '../components/EnhancedAssessmentBuilder/QuestionEditor';
import AIBulkGenerator from '../components/EnhancedAssessmentBuilder/AIBulkGenerator';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export const EnhancedAssessmentBuilderPage = ({ user }) => {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const isEdit = !!assessmentId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

  const [assessmentData, setAssessmentData] = useState({
    assessmentMode: '',
    title: '',
    subject: 'Mathematics',
    stage: 'KS4',
    examBoard: 'AQA',
    tier: 'Higher',
    durationMinutes: 45,
    instructions: '',
    shuffleQuestions: false,
    shuffleOptions: false,
    allowDraftSaving: true,
    questions: [],
    class_id: null
  });

  const [showAIBulk, setShowAIBulk] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      const response = await axios.get(`${API}/teacher/assessments/${assessmentId}/enhanced`);
      setAssessmentData(response.data.assessment);
      setCurrentStep(3);
      setLoading(false);
    } catch (error) {
      alert('Failed to load assessment');
      navigate('/teacher/assessments');
    }
  };

  const updateField = (field, value) => {
    setAssessmentData({ ...assessmentData, [field]: value });
  };

  const addQuestion = () => {
    const newQuestion = {
      questionNumber: assessmentData.questions.length + 1,
      questionType: '',
      questionBody: '',
      stimulusBlock: null,
      maxMarks: 1,
      subject: assessmentData.subject,
      topic: '',
      difficulty: 'Medium',
      tags: [],
      options: [],
      allowMultiSelect: false,
      parts: [],
      answerType: 'TEXT',
      calculatorAllowed: false,
      markScheme: '',
      modelAnswer: '',
      source: 'manual'
    };
    setAssessmentData({
      ...assessmentData,
      questions: [...assessmentData.questions, newQuestion]
    });
  };

  const updateQuestion = (index, updatedQuestion) => {
    const newQuestions = [...assessmentData.questions];
    newQuestions[index] = updatedQuestion;
    setAssessmentData({ ...assessmentData, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    const newQuestions = assessmentData.questions.filter((_, i) => i !== index);
    const renumbered = newQuestions.map((q, i) => ({ ...q, questionNumber: i + 1 }));
    setAssessmentData({ ...assessmentData, questions: renumbered });
  };

  const handleAIBulkGenerate = (questions) => {
    const numbered = questions.map((q, i) => ({
      ...q,
      questionNumber: assessmentData.questions.length + i + 1
    }));
    setAssessmentData({
      ...assessmentData,
      questions: [...assessmentData.questions, ...numbered]
    });
    setShowAIBulk(false);
  };

  const showNotification = (message, type = 'info') => {
    // Handle error objects/arrays
    let displayMessage = message;
    if (typeof message === 'object') {
      if (Array.isArray(message)) {
        // Pydantic validation errors
        displayMessage = message.map(err => err.msg || JSON.stringify(err)).join(', ');
      } else {
        displayMessage = message.message || JSON.stringify(message);
      }
    }
    
    setNotification({ show: true, message: displayMessage, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  const validateAssessment = () => {
    console.log('🔍 Validating assessment...');
    console.log('Title:', assessmentData.title);
    console.log('Questions count:', assessmentData.questions.length);
    console.log('Assessment mode:', assessmentData.assessmentMode);
    
    if (!assessmentData.title.trim()) {
      console.log('❌ Validation failed: No title');
      showNotification('Please enter an assessment title', 'error');
      return false;
    }

    if (assessmentData.questions.length === 0) {
      console.log('❌ Validation failed: No questions');
      showNotification('Please add at least one question', 'error');
      return false;
    }

    if (assessmentData.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE' && assessmentData.questions.length < 1) {
      console.log('❌ Validation failed: Formative mode needs at least 1 question');
      showNotification('Formative mode requires at least 1 question', 'error');
      return false;
    }

    if (assessmentData.assessmentMode === 'SUMMATIVE_MULTI_QUESTION' && (assessmentData.questions.length < 3 || assessmentData.questions.length > 20)) {
      console.log('❌ Validation failed: Summative mode needs 3-20 questions');
      showNotification('Summative mode requires 3-20 questions', 'error');
      return false;
    }

    for (const q of assessmentData.questions) {
      if (!q.questionBody.trim()) {
        console.log(`❌ Validation failed: Question ${q.questionNumber} has no body`);
        showNotification(`Question ${q.questionNumber} is missing question text`, 'error');
        return false;
      }
    }

    console.log('✅ Validation passed');
    return true;
  };

  const saveDraft = async () => {
    console.log('🔵 Save Draft clicked');
    
    if (!validateAssessment()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, saving...');
    setSaving(true);
    
    try {
      console.log('📤 Sending request to backend...');
      console.log('Assessment data:', assessmentData);
      
      if (isEdit) {
        console.log('Updating existing assessment:', assessmentId);
        await axios.put(`${API}/teacher/assessments/${assessmentId}/questions`, assessmentData.questions);
        showNotification('Draft saved successfully!', 'success');
      } else {
        console.log('Creating new assessment');
        const response = await axios.post(`${API}/teacher/assessments/enhanced`, assessmentData);
        console.log('✅ Response received:', response.data);
        showNotification('Assessment created as draft!', 'success');
        navigate(`/teacher/assessments/${response.data.assessment.id}/edit`);
      }
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to save';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Pydantic validation errors
          errorMessage = detail.map(err => err.msg || 'Validation error').join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
      console.log('🔵 Save Draft completed');
    }
  };

  const handlePublishClick = () => {
    console.log('🟢 Publish Assessment clicked');
    
    if (!validateAssessment()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, showing confirmation dialog');
    setShowPublishConfirm(true);
  };

  const confirmPublish = async () => {
    console.log('✅ User confirmed publish');
    setShowPublishConfirm(false);
    setSaving(true);
    
    try {
      let finalAssessmentId = assessmentId;

      if (!isEdit) {
        console.log('Creating assessment before publishing');
        const response = await axios.post(`${API}/teacher/assessments/enhanced`, assessmentData);
        finalAssessmentId = response.data.assessment.id;
        console.log('✅ Assessment created:', finalAssessmentId);
      } else {
        console.log('Updating existing assessment:', assessmentId);
        await axios.put(`${API}/teacher/assessments/${assessmentId}/questions`, assessmentData.questions);
      }

      console.log('📤 Publishing assessment:', finalAssessmentId);
      await axios.post(`${API}/teacher/assessments/${finalAssessmentId}/publish`);
      console.log('✅ Assessment published successfully');
      showNotification('Assessment published successfully!', 'success');
      setTimeout(() => navigate('/teacher/assessments'), 1500);
    } catch (error) {
      console.error('❌ Error publishing:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to publish';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Pydantic validation errors
          errorMessage = detail.map(err => err.msg || 'Validation error').join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
      console.log('🟢 Publish Assessment completed');
    }
  };

  const cancelPublish = () => {
    console.log('❌ User cancelled publish');
    setShowPublishConfirm(false);
  };

  const totalMarks = assessmentData.questions.reduce((sum, q) => {
    if (q.questionType === 'STRUCTURED_WITH_PARTS') {
      return sum + (q.parts || []).reduce((pSum, p) => pSum + (p.maxMarks || 0), 0);
    }
    return sum + (q.maxMarks || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Assessment' : 'Create New Assessment'}
              </h1>
              <p className="text-sm text-gray-600">Step {currentStep} of 3</p>
            </div>
            <button
              onClick={() => navigate('/teacher/assessments')}
              className="text-gray-600 hover:text-gray-900"
            >
              ✕ Close
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <div className={`flex-1 h-1 rounded ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <AssessmentModeSelector
              selectedMode={assessmentData.assessmentMode}
              onModeChange={(mode) => updateField('assessmentMode', mode)}
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!assessmentData.assessmentMode}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Assessment Details →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Assessment Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Title *</label>
              <input
                type="text"
                value={assessmentData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Quadratic Equations Mid-Term Assessment"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={assessmentData.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                  <option>English</option>
                  <option>History</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={assessmentData.stage}
                  onChange={(e) => updateField('stage', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>KS3</option>
                  <option>KS4</option>
                  <option>KS5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Board</label>
                <select
                  value={assessmentData.examBoard}
                  onChange={(e) => updateField('examBoard', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>AQA</option>
                  <option>Edexcel</option>
                  <option>OCR</option>
                  <option>WJEC</option>
                  <option>CIE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select
                  value={assessmentData.tier}
                  onChange={(e) => updateField('tier', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Foundation</option>
                  <option>Higher</option>
                  <option>Intermediate</option>
                  <option>None</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) - Between 1 and 60
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={assessmentData.durationMinutes}
                onChange={(e) => updateField('durationMinutes', parseInt(e.target.value) || 45)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (Optional)</label>
              <textarea
                value={assessmentData.instructions}
                onChange={(e) => updateField('instructions', e.target.value)}
                placeholder="Add any special instructions for students..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assessmentData.shuffleQuestions}
                  onChange={(e) => updateField('shuffleQuestions', e.target.checked)}
                  disabled={assessmentData.assessmentMode !== 'SUMMATIVE_MULTI_QUESTION'}
                  className="rounded"
                />
                <span className="text-sm">Shuffle questions</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assessmentData.shuffleOptions}
                  onChange={(e) => updateField('shuffleOptions', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Shuffle MCQ options</span>
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next: Add Questions →
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{assessmentData.title || 'Untitled Assessment'}</h2>
                  <div className="flex flex-wrap gap-4 text-sm opacity-90">
                    <span>📚 {assessmentData.subject}</span>
                    <span>⏱️ {assessmentData.durationMinutes} minutes</span>
                    <span>📝 {assessmentData.questions.length} questions</span>
                    <span>🎯 {totalMarks} marks</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium"
                >
                  Edit Details
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {assessmentData.questions.map((question, index) => (
                <QuestionEditor
                  key={index}
                  question={question}
                  questionIndex={index}
                  onQuestionChange={updateQuestion}
                  onRemove={removeQuestion}
                  assessmentMode={assessmentData.assessmentMode}
                  assessmentId={assessmentId}
                />
              ))}

              <div className="flex gap-3">
                <button
                  onClick={addQuestion}
                  className="flex-1 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  + Add Question Manually
                </button>
                <button
                  onClick={() => setShowAIBulk(true)}
                  className="flex-1 py-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  🤖 Generate Multiple Questions with AI
                </button>
              </div>
            </div>

            {showAIBulk && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">AI Bulk Question Generator</h3>
                      <button
                        onClick={() => setShowAIBulk(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    <AIBulkGenerator
                      onQuestionsGenerated={handleAIBulkGenerate}
                      assessmentMode={assessmentData.assessmentMode}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center sticky bottom-0">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Draft'}
              </button>
              <button
                onClick={handlePublishClick}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Publishing...' : '🚀 Publish Assessment'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Custom Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="mb-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Publish Assessment?
              </h3>
              <p className="text-center text-gray-600">
                Are you sure you want to publish this assessment? Students will be able to access it immediately.
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelPublish}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-600' :
            notification.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          } text-white`}>
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
