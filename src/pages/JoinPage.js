import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';

export const JoinPage = () => {
  const [joinCode, setJoinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Phase 4: Class-linked assessment state
  const [checkingCode, setCheckingCode] = useState(false);
  const [classRoster, setClassRoster] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Phase 4: Check if assessment is class-linked when join code changes
  const handleCodeChange = async (code) => {
    setJoinCode(code.toUpperCase());
    setClassRoster(null);
    setSelectedStudentId('');
    setStudentName('');
    
    if (code.length === 6) {
      setCheckingCode(true);
      try {
        const response = await axios.get(`${API}/public/assessment/${code.toUpperCase()}/class-roster`);
        if (response.data.has_roster && response.data.students.length > 0) {
          setClassRoster(response.data);
        }
      } catch (err) {
        // Silently fail - code might be invalid or not class-linked
        console.log('Not a class-linked assessment or invalid code');
      }
      setCheckingCode(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        join_code: joinCode.toUpperCase(),
        student_name: studentName
      };
      
      // Phase 4: Include student_id if selected from roster
      if (classRoster && selectedStudentId) {
        payload.student_id = selectedStudentId;
        // Use display name from roster
        const selectedStudent = classRoster.students.find(s => s.id === selectedStudentId);
        if (selectedStudent) {
          payload.student_name = selectedStudent.display_name;
        }
      }
      
      const response = await axios.post(`${API}/public/join`, payload);
      
      // Check if it's an Enhanced Assessment
      const attemptId = response.data.attempt_id;
      const isEnhanced = response.data.is_enhanced || false;
      
      if (isEnhanced) {
        navigate(`/enhanced-attempt/${attemptId}`);
      } else {
        navigate(`/attempt/${attemptId}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to join assessment');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full" data-testid="join-container">
        <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center" data-testid="join-title">Join Assessment</h1>
        <p className="text-gray-600 mb-6 text-center">Enter your details to begin</p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="code-label">Assessment Code</label>
            <div className="relative">
              <input
                data-testid="code-input"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                value={joinCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                required
                maxLength={6}
                placeholder="e.g., ABC123"
              />
              {checkingCode && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Phase 4: Show class roster dropdown if assessment is class-linked */}
          {classRoster && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Name ({classRoster.class_name})
              </label>
              <select
                data-testid="student-select"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const student = classRoster.students.find(s => s.id === e.target.value);
                  if (student) setStudentName(student.display_name);
                }}
                required
              >
                <option value="">-- Select your name --</option>
                {classRoster.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.display_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Can't find your name? Contact your teacher.
              </p>
            </div>
          )}

          {/* Show name input only if NOT class-linked */}
          {!classRoster && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="name-label">Your Name</label>
              <input
                data-testid="name-input"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm" data-testid="join-error">{error}</div>
          )}

          <button
            data-testid="join-submit-btn"
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading || (classRoster && !selectedStudentId)}
          >
            {loading ? 'Joining...' : 'Join Assessment'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Attempt Page
