import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = window.location.origin;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = ({ user }) => {
  const [teachers, setTeachers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teachersRes, assessmentsRes] = await Promise.all([
        axios.get(`${API}/admin/teachers`),
        axios.get(`${API}/admin/assessments`)
      ]);
      setTeachers(teachersRes.data);
      setAssessments(assessmentsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleRoleChange = async (teacherId, newRole) => {
    try {
      await axios.put(`${API}/admin/teachers/${teacherId}/role?role=${newRole}`);
      loadData();
    } catch (error) {
      alert('Failed to update role');
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
              <button onClick={() => navigate('/teacher/questions')} className="text-gray-700 hover:text-blue-600">Questions</button>
              <button onClick={() => navigate('/teacher/assessments')} className="text-gray-700 hover:text-blue-600">Assessments</button>
              <button onClick={() => navigate('/admin/dashboard')} className="text-blue-600 font-medium">Admin</button>
            </div>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8" data-testid="admin-title">Admin Dashboard</h2>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="teachers-title">Teachers ({teachers.length})</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : teachers.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No teachers yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="teachers-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-700 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.user_id} className="border-b" data-testid={`teacher-${t.user_id}`}>
                      <td className="py-3 px-4">{t.name}</td>
                      <td className="py-3 px-4 text-gray-600">{t.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {t.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {t.user_id !== user.user_id && (
                          <select
                            value={t.role}
                            onChange={(e) => handleRoleChange(t.user_id, e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                            data-testid={`role-select-${t.user_id}`}
                          >
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="all-assessments-title">All Assessments ({assessments.length})</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : assessments.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No assessments yet</p>
          ) : (
            <div className="space-y-3" data-testid="all-assessments-list">
              {assessments.map((a) => (
                <div key={a.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center" data-testid={`admin-assessment-${a.id}`}>
                  <div>
                    <p className="font-medium text-gray-900">Code: {a.join_code}</p>
                    <p className="text-sm text-gray-600">Teacher: {a.teacher_name}</p>
                    <p className="text-sm text-gray-500">Status: {a.status}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/teacher/assessments/${a.id}`)}
                    className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                    data-testid={`view-assessment-${a.id}`}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};