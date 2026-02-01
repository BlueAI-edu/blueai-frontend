import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import LaTeXRenderer from '../components/LaTeXRenderer';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export const EnhancedSubmissionDetailPage = ({ user }) => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  
  // Feedback state
  const [questionScores, setQuestionScores] = useState({});
  const [www, setWww] = useState('');
  const [ebi, setEbi] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');

  useEffect(() => {
    loadData();
  }, [attemptId]);

  const loadData = async () => {
    try {
      const response = await axios.get(`${API}/teacher/submissions/${attemptId}/enhanced`);
      setData(response.data);
      
      // Initialize feedback if already marked
      if (response.data.attempt.status === 'marked') {
        setWww(response.data.attempt.www || '');
        setEbi(response.data.attempt.next_steps || '');
        setOverallFeedback(response.data.attempt.overall_feedback || '');
        
        // Initialize question scores if available
        if (response.data.attempt.questionScores) {
          setQuestionScores(response.data.attempt.questionScores);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading submission:', error);
      alert('Failed to load submission');
      setLoading(false);
    }
  };

  const handleScoreChange = (questionNumber, score) => {
    setQuestionScores(prev => ({
      ...prev,
      [questionNumber]: parseInt(score) || 0
    }));
  };

  const calculateTotalScore = () => {
    return Object.values(questionScores).reduce((sum, score) => sum + (score || 0), 0);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const totalScore = calculateTotalScore();
      
      await axios.post(`${API}/teacher/submissions/${attemptId}/mark-enhanced`, {
        questionScores,
        totalScore,
        www,
        next_steps: ebi,
        overall_feedback: overallFeedback
      });
      
      alert('Feedback saved successfully!');
      loadData();
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert(error.response?.data?.detail || 'Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-800">Submission not found</p>
      </div>
    );
  }

  const { attempt, assessment } = data;
  const isFormative = assessment.assessmentMode === 'FORMATIVE_SINGLE_LONG_RESPONSE';
  const answers = attempt.answers || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <button 
              onClick={() => navigate(`/teacher/assessments/${assessment.id}`)} 
              className="text-gray-700 hover:text-blue-600"
            >
              ← Back to Submissions
            </button>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{attempt.student_name}'s Submission</h2>
              <p className="text-gray-600">{assessment.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {assessment.assessmentMode?.replace(/_/g, ' ')}
                </span>
                {isFormative && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Feedback Only (No Score)
                  </span>
                )}
              </div>
            </div>
            {!isFormative && (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Total Score</p>
                <p className="text-3xl font-bold text-blue-600">
                  {calculateTotalScore()} / {assessment.totalMarks}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6 mb-6">
          {assessment.questions?.map((question, index) => {
            const isStructured = question.questionType === 'STRUCTURED_WITH_PARTS' && question.parts && question.parts.length > 0;
            
            return (
              <div key={question.questionNumber} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {question.questionNumber}
                  </h3>
                  <div className="flex items-center gap-2">
                    {question.maxMarks && !isFormative && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {question.maxMarks} marks
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Question:</p>
                  <div className="prose max-w-none">
                    <LaTeXRenderer text={question.questionBody || ''} />
                  </div>
                </div>

                {/* Structured Question Parts */}
                {isStructured ? (
                  <div className="space-y-4">
                    {question.parts.map((part, partIdx) => {
                      const partKey = `${question.questionNumber}-${part.partLabel}`;
                      const partAnswer = answers[partKey];
                      
                      return (
                        <div key={partIdx} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-blue-600 text-lg">({part.partLabel})</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {part.maxMarks} {part.maxMarks === 1 ? 'mark' : 'marks'}
                            </span>
                          </div>

                          {/* Part Prompt */}
                          <div className="mb-3 p-3 bg-gray-50 rounded">
                            <div className="prose max-w-none text-sm">
                              <LaTeXRenderer text={part.partPrompt || ''} />
                            </div>
                          </div>

                          {/* Student Answer for this part */}
                          <div className="mb-3 p-3 bg-blue-50 rounded">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Student's Answer:</p>
                            <div className="prose max-w-none">
                              {partAnswer ? (
                                <LaTeXRenderer text={String(partAnswer)} />
                              ) : (
                                <p className="text-gray-500 italic text-sm">No answer provided</p>
                              )}
                            </div>
                          </div>

                          {/* Mark Scheme for part */}
                          {part.markScheme && (
                            <div className="mb-3 p-3 bg-green-50 rounded">
                              <p className="text-xs text-gray-600 mb-1 font-medium">Mark Scheme:</p>
                              <div className="prose max-w-none text-sm">
                                <LaTeXRenderer text={part.markScheme || ''} />
                              </div>
                            </div>
                          )}

                          {/* Score Input for part */}
                          {!isFormative && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marks for part {part.partLabel}:
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={part.maxMarks}
                                  value={questionScores[partKey] || 0}
                                  onChange={(e) => handleScoreChange(partKey, e.target.value)}
                                  className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">out of {part.maxMarks}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {/* Non-structured question - show as before */}
                    {/* Student Answer */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2 font-medium">Student's Answer:</p>
                      <div className="prose max-w-none">
                        {answers[question.questionNumber] ? (
                          <LaTeXRenderer text={String(answers[question.questionNumber])} />
                        ) : (
                          <p className="text-gray-500 italic">No answer provided</p>
                        )}
                      </div>
                    </div>

                    {/* Mark Scheme (if available) */}
                    {question.markScheme && (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Mark Scheme:</p>
                        <div className="prose max-w-none text-sm">
                          <LaTeXRenderer text={question.markScheme || ''} />
                        </div>
                      </div>
                    )}

                    {/* Model Answer (if available) */}
                    {question.modelAnswer && (
                      <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Model Answer:</p>
                        <div className="prose max-w-none text-sm">
                          <LaTeXRenderer text={question.modelAnswer || ''} />
                        </div>
                      </div>
                    )}

                    {/* Score Input (only for non-formative) */}
                    {!isFormative && question.maxMarks && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marks Awarded:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={question.maxMarks}
                            value={questionScores[question.questionNumber] || 0}
                            onChange={(e) => handleScoreChange(question.questionNumber, e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-600">out of {question.maxMarks}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Feedback Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Overall Feedback</h3>

          {/* WWW */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-green-700 mb-2">
              ✅ What Went Well (WWW)
            </label>
            <textarea
              value={www}
              onChange={(e) => setWww(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="What did the student do well?"
            />
          </div>

          {/* EBI */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-orange-700 mb-2">
              📈 Even Better If / Next Steps (EBI)
            </label>
            <textarea
              value={ebi}
              onChange={(e) => setEbi(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="What could the student improve?"
            />
          </div>

          {/* Overall */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              💬 Overall Feedback
            </label>
            <textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="General comments or summary"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate(`/teacher/assessments/${assessment.id}`)}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSubmissionDetailPage;
