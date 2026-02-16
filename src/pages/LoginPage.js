import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { GoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/msalConfig';

export const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle error messages from AuthCallback
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      // Clear the error from location state
      navigate('/teacher/login', { replace: true });
    }
  }, [location.state, navigate]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let userData;
    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const payload = isSignUp
        ? { email, password, name, school_name: schoolName }
        : { email, password };

      const response = await axios.post(`${API}${endpoint}`, payload);
      userData = response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
      setLoading(false);
      return;
    }
    navigate('/teacher/dashboard', { state: { user: userData } });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    let userData;
    try {
      const response = await axios.post(`${API}/auth/google`, {}, {
        headers: { 'Authorization': `Bearer ${credentialResponse.credential}` }
      });
      userData = response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Google authentication failed');
      setLoading(false);
      return;
    }
    navigate('/teacher/dashboard', { state: { user: userData } });
  };

  const { instance } = useMsal();

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    let userData;
    try {
      const msalResponse = await instance.loginPopup(loginRequest);
      const response = await axios.post(`${API}/auth/microsoft`, {}, {
        headers: { 'Authorization': `Bearer ${msalResponse.accessToken}` }
      });
      userData = response.data;
    } catch (err) {
      if (err.errorCode === 'user_cancelled') {
        setLoading(false);
        return;
      }
      setError(err.response?.data?.detail || 'Microsoft authentication failed');
      setLoading(false);
      return;
    }
    navigate('/teacher/dashboard', { state: { user: userData } });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/auth/forgot-password`, { email: resetEmail });
      setResetSent(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to send reset email');
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full" data-testid="forgot-password-container">
          <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center" data-testid="forgot-password-title">Reset Password</h1>
          
          {resetSent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-4">If an account exists with that email, we've sent a password reset link.</p>
              <button
                onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
                className="text-blue-600 hover:text-blue-700 font-medium"
                data-testid="back-to-login-btn"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-6">
              <p className="text-gray-600 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  data-testid="reset-email-input"
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm" data-testid="reset-error">{error}</div>
              )}

              <button
                data-testid="send-reset-btn"
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
                data-testid="cancel-reset-btn"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full" data-testid="login-container">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-600 mb-2" data-testid="login-title">BlueAI</h1>
          <p className="text-gray-600">Teacher Portal</p>
        </div>

        {/* Toggle between Sign Up and Sign In */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 pb-3 font-medium transition-colors ${!isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            data-testid="signin-tab"
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 pb-3 font-medium transition-colors ${isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            data-testid="signup-tab"
          >
            Sign Up
          </button>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  data-testid="name-input"
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School / Organisation (Optional)</label>
                <input
                  data-testid="school-input"
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Greenfield Academy"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              data-testid="email-input"
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              data-testid="password-input"
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {!isSignUp && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                data-testid="forgot-password-link"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm" data-testid="auth-error">{error}</div>
          )}

          <button
            data-testid="email-auth-btn"
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {/* Google */}
          <div className="flex justify-center" data-testid="google-login-btn">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed')}
              theme="outline"
              size="large"
              width="100%"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          {/* Microsoft */}
          <button
            data-testid="microsoft-login-btn"
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full bg-white text-gray-700 py-3 px-6 rounded-lg font-medium border-2 border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-blue-600 hover:text-blue-700 font-medium"
            data-testid="toggle-auth-mode"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

// Public Join Page
