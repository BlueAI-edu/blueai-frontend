import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { Navbar } from '@/components/Navbar';
import CreateClassModal from '@/components/classes/CreateClassModal';
import { PageLoader } from '@/components/common';

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
    }
    setLoading(false);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="classes-title">Classes</h2>
            <p className="text-gray-600">Organise students and track their progress</p>
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
            <p className="text-gray-600 mb-6">Create your first class to organise students and link them to assessments.</p>
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

export default ClassesPage;
