import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { handleApiError } from '@/lib/handle-error';
import { Navbar } from '@/components/Navbar';
import AddStudentModal from '@/components/classes/AddStudentModal';
import EditClassModal from '@/components/classes/EditClassModal';
import AssignAssessmentModal from '@/components/classes/AssignAssessmentModal';
import ClassAnalyticsTab from '@/components/classes/ClassAnalyticsTab';
import { PageLoader, LoadingSpinner } from '@/components/common';

export const ClassDetailPage = ({ user }) => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  useEffect(() => {
    loadAssignments();
  }, [classId]);

  const loadClassData = async () => {
    try {
      const response = await axios.get(`${API}/teacher/classes/${classId}`);
      setClassData(response.data);
    } catch (error) {
    }
    setLoading(false);
  };

  const loadAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const response = await axios.get(`${API}/teacher/classes/${classId}/assignments`);
      setAssignments(response.data.assignments || []);
    } catch (error) {
    }
    setAssignmentsLoading(false);
  };

  const handleToggleAssignment = async (assignmentId, currentStatus) => {
    try {
      const action = currentStatus === 'open' ? 'close' : 'open';
      await axios.post(`${API}/teacher/assignments/${assignmentId}/${action}`);
      loadAssignments();
    } catch (error) {
      handleApiError(error, 'Failed to update assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this assignment? The join code will no longer be valid.')) return;
    try {
      await axios.delete(`${API}/teacher/assignments/${assignmentId}`);
      loadAssignments();
    } catch (error) {
      handleApiError(error, 'Failed to delete assignment');
    }
  };

  const handleDeleteClass = async () => {
    if (!window.confirm('Are you sure you want to delete this class? Students will be archived.')) return;

    try {
      await axios.delete(`${API}/teacher/classes/${classId}`);
      navigate('/teacher/classes');
    } catch (error) {
      handleApiError(error, 'Failed to delete class');
    }
  };

  const handleArchiveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the class?')) return;

    try {
      await axios.delete(`${API}/teacher/students/${studentId}`);
      loadClassData();
    } catch (error) {
      handleApiError(error, 'Failed to remove student');
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!classData) {
    return <div className="flex items-center justify-center min-h-screen">Class not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

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
              <p className="text-3xl font-bold text-purple-600">{assignments.length}</p>
              <p className="text-sm text-purple-600">Assessments</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {assignments.reduce((acc, a) => acc + (a.marked_count || 0), 0)}
              </p>
              <p className="text-sm text-green-600">Marked</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">
                {assignments.reduce((acc, a) => acc + (a.submission_count || 0) - (a.marked_count || 0), 0)}
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
            Assessments ({assignments.length})
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
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/teacher/assessments/create')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Create Assessment
                </button>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Assign Assessment
                </button>
              </div>
            </div>

            {assignmentsLoading ? (
              <div className="p-8 text-center"><LoadingSpinner /></div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No assessments assigned to this class yet.</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Assign your first assessment
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{assignment.assessment_title}</p>
                        {assignment.subject && (
                          <p className="text-sm text-gray-500">{assignment.subject}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {assignment.join_code}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            assignment.status === 'open'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {assignment.status === 'open' ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {assignment.submission_count} submitted · {assignment.marked_count} marked
                          {assignment.avg_score != null && ` · Avg: ${assignment.avg_score}%`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleAssignment(assignment.id, assignment.status)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            assignment.status === 'open'
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {assignment.status === 'open' ? 'Close' : 'Reopen'}
                        </button>
                        <button
                          onClick={() => navigate(`/teacher/assessments/${assignment.assessment_id}/enhanced`)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Remove
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

      {/* Assign Assessment Modal */}
      {showAssignModal && (
        <AssignAssessmentModal
          classId={classId}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            setShowAssignModal(false);
            setActiveTab('assignments');
            loadAssignments();
          }}
        />
      )}
    </div>
  );
};

export default ClassDetailPage;
