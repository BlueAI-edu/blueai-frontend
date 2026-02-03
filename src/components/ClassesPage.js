import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';

// Classes Overview Page
export const ClassesPage = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await axios.get(`${API}/teacher/classes`);
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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
              <button className="text-blue-600 font-medium">Classes</button>
              <button onClick={() => navigate('/teacher/analytics')} className="text-gray-700 hover:text-blue-600">Analytics</button>
            </div>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="classes-title">Classes</h2>
            <p className="text-gray-600">Manage your classes and students</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/teacher/classes/import')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              data-testid="import-csv-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Students (CSV)
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              data-testid="create-class-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Class
            </button>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes yet</h3>
            <p className="text-gray-600 mb-6">Create your first class to start managing students and assessments.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create Your First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                data-testid={`class-card-${cls.id}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{cls.class_name}</h3>
                      {cls.subject && <p className="text-sm text-gray-600">{cls.subject}</p>}
                      {cls.year_group && <p className="text-sm text-gray-500">Year {cls.year_group}</p>}
                    </div>
                    {cls.average_score !== null && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        cls.average_score >= 70 ? 'bg-green-100 text-green-700' :
                        cls.average_score >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {cls.average_score}%
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{cls.student_count}</p>
                      <p className="text-gray-600">Students</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{cls.assessment_count}</p>
                      <p className="text-gray-600">Assessments</p>
                    </div>
                  </div>
                  
                  {cls.last_assessment_date && (
                    <p className="text-xs text-gray-500 mt-4">
                      Last assessment: {new Date(cls.last_assessment_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <CreateClassModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadClasses();
          }}
        />
      )}
    </div>
  );
};

// Create Class Modal
const CreateClassModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    class_name: '',
    subject: '',
    year_group: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_name.trim()) {
      setError('Class name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await axios.post(`${API}/teacher/classes`, formData);
      onCreated();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create class');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.class_name}
              onChange={(e) => setFormData({...formData, class_name: e.target.value})}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10X1 Science"
              data-testid="class-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Physics"
              data-testid="subject-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Group</label>
            <input
              type="text"
              value={formData.year_group}
              onChange={(e) => setFormData({...formData, year_group: e.target.value})}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10"
              data-testid="year-group-input"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              data-testid="save-class-btn"
            >
              {saving ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Class Detail Page
export const ClassDetailPage = ({ user }) => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      const response = await axios.get(`${API}/teacher/classes/${classId}`);
      setClassData(response.data);
    } catch (error) {
      console.error('Error loading class:', error);
    }
    setLoading(false);
  };

  const handleDeleteClass = async () => {
    if (!window.confirm('Are you sure you want to delete this class? Students will be archived.')) return;

    try {
      await axios.delete(`${API}/teacher/classes/${classId}`);
      navigate('/teacher/classes');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete class');
    }
  };

  const handleArchiveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the class?')) return;

    try {
      await axios.delete(`${API}/teacher/students/${studentId}`);
      loadClassData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to remove student');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!classData) {
    return <div className="flex items-center justify-center min-h-screen">Class not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-600">BlueAI</h1>
            <button onClick={() => navigate('/teacher/classes')} className="text-gray-700 hover:text-blue-600">
              ← Back to Classes
            </button>
          </div>
          <span className="text-gray-700">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Class Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" data-testid="class-name">
                {classData.class.class_name}
              </h2>
              <div className="flex gap-4 mt-2 text-gray-600">
                {classData.class.subject && <span>{classData.class.subject}</span>}
                {classData.class.year_group && <span>Year {classData.class.year_group}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditClassModal(true)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClass}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{classData.student_count}</p>
              <p className="text-sm text-blue-600">Students</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{classData.assessments.length}</p>
              <p className="text-sm text-purple-600">Assessments</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {classData.assessments.reduce((acc, a) => acc + (a.marked_count || 0), 0)}
              </p>
              <p className="text-sm text-green-600">Marked</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">
                {classData.assessments.reduce((acc, a) => acc + (a.submission_count || 0) - (a.marked_count || 0), 0)}
              </p>
              <p className="text-sm text-amber-600">Pending</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b bg-white rounded-t-lg">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'students' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Students ({classData.student_count})
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'assessments' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Assessments ({classData.assessments.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'analytics' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Students</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/teacher/classes/${classId}/import`)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Import CSV
                </button>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  data-testid="add-student-btn"
                >
                  Add Student
                </button>
              </div>
            </div>

            {classData.students.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No students in this class yet.</p>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Add your first student
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Code</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SEN</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">PP</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">EAL</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {classData.students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            {student.preferred_name && (
                              <p className="text-sm text-gray-500">({student.preferred_name})</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{student.student_code || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {student.sen_flag && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">SEN</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {student.pupil_premium_flag && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs">PP</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {student.eal_flag && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">EAL</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/teacher/students/${student.id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleArchiveStudent(student.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Assessments</h3>
              <button
                onClick={() => navigate(`/teacher/assessments/new?classId=${classId}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                Create Assessment
              </button>
            </div>

            {classData.assessments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No assessments for this class yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {classData.assessments.map((assessment) => (
                  <div key={assessment.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">Assessment #{assessment.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          Join Code: <span className="font-mono text-blue-600">{assessment.join_code}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                          {assessment.marked_count}/{assessment.submission_count} marked
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          assessment.status === 'started' ? 'bg-green-100 text-green-700' :
                          assessment.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {assessment.status}
                        </span>
                        <button
                          onClick={() => navigate(`/teacher/assessments/${assessment.id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <ClassAnalyticsTab classId={classId} className={classData.class.class_name} />
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddStudentModal 
          classId={classId}
          onClose={() => setShowAddStudentModal(false)}
          onAdded={() => {
            setShowAddStudentModal(false);
            loadClassData();
          }}
        />
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && (
        <EditClassModal 
          classData={classData.class}
          onClose={() => setShowEditClassModal(false)}
          onUpdated={() => {
            setShowEditClassModal(false);
            loadClassData();
          }}
        />
      )}
    </div>
  );
};

// Class Analytics Tab Component
const ClassAnalyticsTab = ({ classId, className }) => {
  const [analytics, setAnalytics] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // overview, heatmap

  useEffect(() => {
    loadAnalytics();
  }, [classId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, heatmapRes] = await Promise.all([
        axios.get(`${API}/teacher/classes/${classId}/analytics`),
        axios.get(`${API}/teacher/classes/${classId}/analytics/heatmap`)
      ]);
      setAnalytics(analyticsRes.data);
      setHeatmap(heatmapRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics');
    }
    setLoading(false);
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const response = await axios.get(`${API}/teacher/classes/${classId}/analytics/export-csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Class_Analytics_${className.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
    setExportingCSV(false);
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const response = await axios.get(`${API}/teacher/classes/${classId}/analytics/export-pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Class_Analytics_${className.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
    setExportingPDF(false);
  };

  // Helper function to get color based on percentage
  const getScoreColor = (percentage) => {
    if (percentage === null) return 'bg-gray-100';
    if (percentage >= 70) return 'bg-green-500 text-white';
    if (percentage >= 50) return 'bg-yellow-400 text-gray-900';
    if (percentage >= 30) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getScoreBgStyle = (percentage) => {
    if (percentage === null) return { backgroundColor: '#f3f4f6' };
    if (percentage >= 70) return { backgroundColor: '#22c55e' };
    if (percentage >= 50) return { backgroundColor: '#facc15' };
    if (percentage >= 30) return { backgroundColor: '#f97316' };
    return { backgroundColor: '#ef4444' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-red-600">{error || 'Failed to load analytics'}</p>
        <button onClick={loadAnalytics} className="mt-4 text-blue-600 hover:underline">Retry</button>
      </div>
    );
  }

  const { summary, students, topics_to_reteach, assessments } = analytics;

  return (
    <div className="space-y-6">
      {/* View Toggle and Export Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'overview' 
                ? 'bg-white text-blue-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="overview-tab"
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('heatmap')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'heatmap' 
                ? 'bg-white text-blue-600 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="heatmap-tab"
          >
            Performance Heatmap
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            data-testid="export-csv-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportingCSV ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            data-testid="export-pdf-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {exportingPDF ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Heatmap View */}
      {activeView === 'heatmap' && heatmap && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Performance Heatmap
            </h3>
            <p className="text-sm text-gray-600 mt-1">Students × Assessments - hover for details</p>
          </div>
          
          {/* Color Legend */}
          <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-4 text-xs">
            <span className="text-gray-600">Score Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>70%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-400"></div>
              <span>50-69%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span>30-49%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>&lt;30%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-200"></div>
              <span>No data</span>
            </div>
          </div>

          {heatmap.matrix?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                      Student
                    </th>
                    {heatmap.assessments?.map((a, idx) => (
                      <th 
                        key={idx} 
                        className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[80px]"
                        title={`${a.subject} - ${a.topic || 'N/A'}`}
                      >
                        <div className="truncate max-w-[80px]">{a.subject}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{a.join_code}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50 sticky right-0 z-10">
                      Avg
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {heatmap.matrix.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {row.preferred_name || row.student_name}
                          </span>
                          {row.sen_flag && (
                            <span className="px-1 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded">SEN</span>
                          )}
                          {row.pupil_premium_flag && (
                            <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">PP</span>
                          )}
                        </div>
                      </td>
                      {row.scores?.map((score, scoreIdx) => (
                        <td 
                          key={scoreIdx} 
                          className="px-1 py-1 text-center"
                          title={score.percentage !== null 
                            ? `${score.score}/${score.max_marks} (${score.percentage}%)` 
                            : 'No submission'
                          }
                        >
                          <div 
                            className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium cursor-default transition-transform hover:scale-105 ${getScoreColor(score.percentage)}`}
                          >
                            {score.percentage !== null ? `${Math.round(score.percentage)}%` : '-'}
                          </div>
                        </td>
                      ))}
                      <td className="px-2 py-1 text-center sticky right-0 bg-blue-50 z-10">
                        <span className={`text-sm font-bold ${
                          row.average === null ? 'text-gray-400' :
                          row.average >= 70 ? 'text-green-600' :
                          row.average >= 50 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {row.average !== null ? `${row.average}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No assessment data available for heatmap.</p>
              <p className="text-sm mt-2">Link assessments to this class to see performance data.</p>
            </div>
          )}
        </div>
      )}

      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{summary.class_average || 0}%</p>
              <p className="text-sm text-gray-600">Class Average</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{summary.improving_count}</p>
              <p className="text-sm text-gray-600">Improving</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{summary.students_needing_support}</p>
              <p className="text-sm text-gray-600">Need Support</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{summary.declining_count}</p>
              <p className="text-sm text-gray-600">Declining</p>
            </div>
          </div>

          {/* Students Needing Support */}
          {students.needing_support.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Students Needing Support ({students.needing_support.length})
          </h3>
          <div className="space-y-3">
            {students.needing_support.map((student, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{student.student_name}</p>
                  <p className="text-sm text-red-600">{student.support_reasons.join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{student.average_score || 0}%</p>
                  <p className="text-xs text-gray-500">{student.marked_attempts} assessments</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics to Reteach */}
      {topics_to_reteach.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Topics to Reteach ({topics_to_reteach.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics_to_reteach.map((topic, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900">{topic.topic}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    topic.average_percentage < 40 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {topic.average_percentage}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">{topic.attempts} attempts</p>
                {topic.struggling_students.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Struggling: {topic.struggling_students.slice(0, 3).join(', ')}
                    {topic.struggling_students.length > 3 && ` +${topic.struggling_students.length - 3} more`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Students Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">All Students Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assessments</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Average</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.all.map((student, idx) => (
                <tr key={idx} className={student.needs_support ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{student.student_name}</p>
                      <div className="flex gap-1 mt-1">
                        {student.sen_flag && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">SEN</span>}
                        {student.pupil_premium_flag && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">PP</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{student.marked_attempts}</td>
                  <td className="px-4 py-3 text-center">
                    {student.average_score !== null ? (
                      <span className={`font-medium ${
                        student.average_score >= 70 ? 'text-green-600' :
                        student.average_score >= 50 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {student.average_score}%
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {student.trend === 'improving' && (
                      <span className="text-green-600 flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Improving
                      </span>
                    )}
                    {student.trend === 'declining' && (
                      <span className="text-red-600 flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Declining
                      </span>
                    )}
                    {student.trend === 'stable' && <span className="text-gray-500">Stable</span>}
                    {student.trend === 'no_data' && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {student.needs_support ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Needs Support</span>
                    ) : student.marked_attempts > 0 ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">On Track</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">No Data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Assessments */}
      {assessments.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Recent Assessments</h3>
          </div>
          <div className="divide-y">
            {assessments.slice(0, 5).map((assessment, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{assessment.subject}</p>
                  {assessment.topic && <p className="text-sm text-gray-500">{assessment.topic}</p>}
                  <p className="text-xs text-gray-400">{assessment.marked_count}/{assessment.total_submissions} marked</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    assessment.average_score >= 70 ? 'text-green-600' :
                    assessment.average_score >= 50 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {assessment.average_score}%
                  </p>
                  <p className="text-xs text-gray-500">avg score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

// Add Student Modal
const AddStudentModal = ({ classId, onClose, onAdded }) => {
  const [formData, setFormData] = useState({
    class_id: classId,
    first_name: '',
    last_name: '',
    preferred_name: '',
    student_code: '',
    email: '',
    sen_flag: false,
    pupil_premium_flag: false,
    eal_flag: false,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await axios.post(`${API}/teacher/students`, formData);
      onAdded();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to add student');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Add Student</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                data-testid="student-first-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                data-testid="student-last-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
              <input
                type="text"
                value={formData.preferred_name}
                onChange={(e) => setFormData({...formData, preferred_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Code</label>
              <input
                type="text"
                value={formData.student_code}
                onChange={(e) => setFormData({...formData, student_code: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="e.g., STU001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
              <span className="text-gray-400 font-normal ml-1">(for sending reports)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="student@school.edu"
              data-testid="student-email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Flags</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sen_flag}
                  onChange={(e) => setFormData({...formData, sen_flag: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">SEN</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.pupil_premium_flag}
                  onChange={(e) => setFormData({...formData, pupil_premium_flag: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Pupil Premium</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.eal_flag}
                  onChange={(e) => setFormData({...formData, eal_flag: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">EAL</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
              rows="2"
              placeholder="Optional notes about the student"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              data-testid="save-student-btn"
            >
              {saving ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Class Modal
const EditClassModal = ({ classData, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    class_name: classData.class_name || '',
    subject: classData.subject || '',
    year_group: classData.year_group || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_name.trim()) {
      setError('Class name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await axios.put(`${API}/teacher/classes/${classData.id}`, formData);
      onUpdated();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update class');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit Class</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.class_name}
              onChange={(e) => setFormData({...formData, class_name: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Group</label>
            <input
              type="text"
              value={formData.year_group}
              onChange={(e) => setFormData({...formData, year_group: e.target.value})}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassesPage;
