import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';

export const TeacherDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/teacher/dashboard`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600" data-testid="nav-title">BlueAI</h1>
            <div className="flex gap-4">
              <button onClick={() => navigate('/teacher/dashboard')} className="text-gray-700 hover:text-blue-600" data-testid="nav-dashboard">Dashboard</button>
              <button onClick={() => navigate('/teacher/questions')} className="text-gray-700 hover:text-blue-600" data-testid="nav-questions">Questions</button>
              <button onClick={() => navigate('/teacher/assessments')} className="text-gray-700 hover:text-blue-600" data-testid="nav-assessments">Assessments</button>
              <button onClick={() => navigate('/teacher/classes')} className="text-gray-700 hover:text-blue-600" data-testid="nav-classes">Classes</button>
              <button onClick={() => navigate('/teacher/analytics')} className="text-gray-700 hover:text-blue-600" data-testid="nav-analytics">Analytics</button>
              {user.role === 'admin' && (
                <button onClick={() => navigate('/admin/dashboard')} className="text-gray-700 hover:text-blue-600" data-testid="nav-admin">Admin</button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teacher/profile')} className="text-gray-700 hover:text-blue-600" data-testid="nav-profile">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {user.name}
              </span>
            </button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-700" data-testid="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8" data-testid="dashboard-title">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow" data-testid="stat-assessments">
            <p className="text-gray-600 text-sm mb-1">Total Assessments</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.total_assessments || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow" data-testid="stat-submissions">
            <p className="text-gray-600 text-sm mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.total_submissions || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow" data-testid="stat-marked">
            <p className="text-gray-600 text-sm mb-1">Marked</p>
            <p className="text-3xl font-bold text-green-600">{stats?.marked || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow" data-testid="stat-unmarked">
            <p className="text-gray-600 text-sm mb-1">Unmarked</p>
            <p className="text-3xl font-bold text-orange-600">{stats?.unmarked || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => navigate('/teacher/questions')}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              data-testid="create-question-btn"
            >
              Create Question
            </button>
            <button
              onClick={() => navigate('/teacher/assessments')}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              data-testid="create-assessment-btn"
            >
              Create Assessment
            </button>
            <button
              onClick={() => navigate('/teacher/ocr-upload')}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
              data-testid="ocr-upload-btn"
            >
              📄 Upload Script (OCR)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Questions Page with Tabs - Manual Builder & AI Generator
