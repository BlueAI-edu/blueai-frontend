import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { Navbar } from '../components/Navbar';

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
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      navigate('/login');
    } catch (error) {
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

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
