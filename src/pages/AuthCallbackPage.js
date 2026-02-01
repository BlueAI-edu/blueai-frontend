import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash;
    
    console.log('[AuthCallback] Processing authentication callback');
    console.log('[AuthCallback] Hash:', hash);
    
    const params = new URLSearchParams(hash.substring(1));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      console.error('[AuthCallback] No session_id found in URL hash');
      navigate('/teacher/login', { state: { error: 'Authentication failed. Please try again.' } });
      return;
    }

    console.log('[AuthCallback] Session ID found:', sessionId.substring(0, 10) + '...');

    const processSession = async () => {
      try {
        console.log('[AuthCallback] Calling backend /auth/session endpoint');
        const response = await axios.post(`${API}/auth/session`, { session_id: sessionId });
        
        console.log('[AuthCallback] Authentication successful, user:', response.data.email);
        navigate('/teacher/dashboard', { state: { user: response.data }, replace: true });
      } catch (error) {
        console.error('[AuthCallback] Session processing error:', error);
        console.error('[AuthCallback] Error details:', error.response?.data || error.message);
        
        const errorMessage = error.response?.data?.detail || 'Authentication failed. Please try logging in again.';
        navigate('/teacher/login', { state: { error: errorMessage } });
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-lg text-gray-700">Authenticating with Google...</div>
        <div className="text-sm text-gray-500 mt-2">Please wait</div>
      </div>
    </div>
  );
};
