import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';

export const JoinPage = () => {
  const [joinCode, setJoinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [candidateNumber, setCandidateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Phase 4: Class-linked assessment state
  const [checkingCode, setCheckingCode] = useState(false);
  const [classRoster, setClassRoster] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Check if the code is an assignment code or class-linked assessment when entered
  const handleCodeChange = async (code) => {
    setJoinCode(code.toUpperCase());
    setClassRoster(null);
    setSelectedStudentId('');
    setStudentName('');
    setFirstName('');
    setLastName('');
    setCandidateNumber('');
    setError('');

    if (code.length === 6) {
      setCheckingCode(true);
      try {
        const response = await axios.get(`${API}/public/assessment/${code.toUpperCase()}/class-roster`);
        if (response.data.has_roster && response.data.students.length > 0) {
          setClassRoster(response.data);
        }
        // type=assignment or has_roster=false → just show the manual name form (no action needed)
      } catch (err) {
        // 400 means the code is valid but the assessment/assignment is closed
        if (err.response?.status === 400) {
          setError('This assessment is now closed. Contact your teacher.');
        }
        // 404 = invalid code — let the submit button validate it on submit
      }
      setCheckingCode(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fullName = classRoster ? studentName : `${firstName.trim()} ${lastName.trim()}`.trim();
      const payload = {
        join_code: joinCode.toUpperCase(),
        student_name: fullName
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
      const msg = err.response?.data?.detail || '';
      if (msg === 'Invalid join code') {
        setError('Invalid join code. Please check the code and try again.');
      } else if (msg === 'This assessment is now closed') {
        setError('This assessment is now closed. Contact your teacher.');
      } else {
        setError(getApiErrorMessage(err, 'Failed to join assessment'));
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full" data-testid="join-container">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold text-blue-600 mb-2">BlueAI Assess</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="join-title">Enter your assessment code</h1>
          <p className="text-gray-600">Use the join code provided by your teacher.</p>
        </div>

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

          {/* Show manual details only if NOT class-linked */}
          {!classRoster && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="first-name-label">First name</label>
                  <input
                    data-testid="first-name-input"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="last-name-label">Last name</label>
                  <input
                    data-testid="last-name-input"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="candidate-label">
                  Student / candidate number <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <input
                  data-testid="candidate-input"
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={candidateNumber}
                  onChange={(e) => setCandidateNumber(e.target.value)}
                  placeholder="e.g., 1042"
                />
              </div>
            </>
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
            {loading ? 'Joining...' : 'Start Assessment'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Attempt Page
