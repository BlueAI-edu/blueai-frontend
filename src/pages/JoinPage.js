import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';

export const JoinPage = () => {
  const [joinCode, setJoinCode] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/public/join`, {
        join_code: joinCode.toUpperCase(),
        student_email: studentEmail.trim(),
      });

      const { attempt_id, is_enhanced } = response.data;
      navigate(is_enhanced ? `/enhanced-attempt/${attempt_id}` : `/attempt/${attempt_id}`);
    } catch (err) {
      const msg = err.response?.data?.detail || '';
      if (msg === 'Invalid join code') {
        setError('Invalid join code. Please check the code and try again.');
      } else if (msg === 'This assessment is now closed') {
        setError('This assessment is now closed. Contact your teacher.');
      } else if (msg === 'You are not enrolled in this class') {
        setError('Your email address was not found in this class. Contact your teacher if this is incorrect.');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="join-title">Join your assessment</h1>
          <p className="text-gray-600">Enter your assessment code and school email to begin.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="code-label">
              Assessment Code
            </label>
            <input
              data-testid="code-input"
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase tracking-widest text-center text-lg font-semibold"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              required
              maxLength={6}
              placeholder="ABC123"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" data-testid="email-label">
              School email address
            </label>
            <input
              data-testid="email-input"
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
              placeholder="your.name@school.ac.uk"
              autoComplete="email"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use the email address your teacher has on record for you.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm" data-testid="join-error">
              {error}
            </div>
          )}

          <button
            data-testid="join-submit-btn"
            type="submit"
            disabled={loading || !joinCode.trim() || !studentEmail.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Join Assessment'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Attempt Page
