import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiErrorMessage } from '@/lib/handle-error';
import { authApi } from '@/services/api';
import { GoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/msalConfig';
import { ReactComponent as LogoSVG } from '../logo.svg';

const INPUT_CLS =
  'w-full border border-[#d7d7d9] rounded-[10px] px-[14px] py-[11px] text-sm ' +
  'text-[#05060f] bg-white outline-none transition-colors box-border ' +
  'focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20';

const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Shell = ({ children }) => (
  <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center px-4 py-6 font-[Inter,system-ui,sans-serif]">
    <div className="mb-7">
      <LogoSVG style={{ height: 34, width: 'auto' }} />
    </div>

    <div className="bg-white rounded-[20px] shadow-[rgba(0,19,41,0.01)_0px_10px_32px_0px,rgba(0,19,41,0.02)_0px_2px_0px_0px,rgba(0,19,41,0.02)_0px_0px_24px_0px] w-full max-w-[420px] p-8">
      {children}
    </div>

    <p className="mt-5 text-xs text-[#696a6f] text-center">
      Teacher portal · BlueAI Assessment Platform
    </p>
  </div>
);

// ─── Forgot password view ─────────────────────────────────────────────────────
const ForgotPasswordView = ({ onBack }) => {
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [sent, setSent]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.requestPasswordReset({ email: resetEmail });
      setSent(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Shell>
        <div className="text-center py-2">
          <div className="w-[52px] h-[52px] rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5">
            <CheckIcon />
          </div>
          <h1 className="text-[22px] font-bold text-[#05060f] tracking-[-0.3px] mb-2">
            Check your email
          </h1>
          <p className="text-sm text-[#696a6f] leading-[1.65] mb-6">
            If an account exists for that address, we've sent a password reset link.
          </p>
          <button
            onClick={() => { setSent(false); onBack(); }}
            className="bg-blue-700 text-white border-none rounded-full px-7 py-[10px] text-sm font-medium cursor-pointer hover:bg-blue-800 transition-colors"
            data-testid="back-to-login-btn"
          >
            Back to Sign In
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#05060f] tracking-[-0.3px] mb-1.5">
          Reset your password
        </h1>
        <p className="text-sm text-[#696a6f] leading-[1.65] m-0">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-medium text-[#05060f] mb-1.5">
            Email address
          </label>
          <input
            data-testid="reset-email-input"
            type="email"
            required
            value={resetEmail}
            onChange={e => setResetEmail(e.target.value)}
            placeholder="you@school.org"
            className={INPUT_CLS}
          />
        </div>

        {error && (
          <div data-testid="reset-error"
            className="bg-red-50 text-red-600 text-[13px] px-[14px] py-[10px] rounded-[10px] leading-[1.5]">
            {error}
          </div>
        )}

        <button
          data-testid="send-reset-btn"
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-700 text-white border-none rounded-full px-6 py-3 text-sm font-medium cursor-pointer hover:bg-blue-800 transition-colors ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>

        <button
          type="button"
          onClick={onBack}
          data-testid="cancel-reset-btn"
          className="bg-transparent border-none cursor-pointer text-[13px] font-medium text-[#696a6f] hover:text-[#05060f] transition-colors py-1 px-0"
        >
          ← Back to Sign In
        </button>
      </form>
    </Shell>
  );
};

// ─── Main login component ─────────────────────────────────────────────────────
export const Login = () => {
  const [isSignUp, setIsSignUp]                   = useState(false);
  const [email, setEmail]                         = useState('');
  const [password, setPassword]                   = useState('');
  const [name, setName]                           = useState('');
  const [schoolName, setSchoolName]               = useState('');
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { instance } = useMsal();

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      navigate('/teacher/login', { replace: true });
    }
  }, [location.state, navigate]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload  = isSignUp
        ? { email, password, name, school_name: schoolName }
        : { email, password };
      await (isSignUp ? authApi.register(payload) : authApi.login(payload));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Authentication failed'));
      setLoading(false);
      return;
    }
    navigate('/teacher/dashboard');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      await authApi.loginWithGoogle(credentialResponse.credential);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Google authentication failed'));
      setLoading(false);
      return;
    }
    navigate('/teacher/dashboard');
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const msalResponse = await instance.loginPopup(loginRequest);
      await authApi.loginWithMicrosoft(msalResponse.accessToken);
    } catch (err) {
      if (err.errorCode === 'user_cancelled') { setLoading(false); return; }
      setError(getApiErrorMessage(err, 'Microsoft authentication failed'));
      setLoading(false);
      return;
    }
    navigate('/teacher/dashboard');
  };

  const switchMode = (signup) => { setIsSignUp(signup); setError(''); };

  if (showForgotPassword) {
    return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <Shell>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#05060f] tracking-[-0.3px] mb-1">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-[#696a6f] m-0 leading-[1.6]">
          {isSignUp ? 'Start your BlueAI teacher account.' : 'Sign in to your teacher portal.'}
        </p>
      </div>

      {/* Tab row */}
      <div className="flex border-b border-[#d7d7d9] mb-6">
        {[
          { label: 'Sign In', signup: false, testId: 'signin-tab' },
          { label: 'Sign Up', signup: true,  testId: 'signup-tab'  },
        ].map(tab => (
          <button
            key={tab.label}
            data-testid={tab.testId}
            onClick={() => switchMode(tab.signup)}
            className={`flex-1 bg-transparent border-none pb-3 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2 ${
              isSignUp === tab.signup
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-[#696a6f]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
        {isSignUp && (
          <>
            <div>
              <label className="block text-[13px] font-medium text-[#05060f] mb-1.5">Full name</label>
              <input
                data-testid="name-input"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#05060f] mb-1.5">
                School / Organisation{' '}
                <span className="font-normal text-[#696a6f]">(optional)</span>
              </label>
              <input
                data-testid="school-input"
                type="text"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                placeholder="Greenfield Academy"
                className={INPUT_CLS}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-[13px] font-medium text-[#05060f] mb-1.5">Email address</label>
          <input
            data-testid="email-input"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@school.org"
            className={INPUT_CLS}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-medium text-[#05060f]">Password</label>
            {!isSignUp && (
              <button
                type="button"
                data-testid="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
                className="bg-transparent border-none cursor-pointer text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors p-0"
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            data-testid="password-input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className={INPUT_CLS}
          />
        </div>

        {error && (
          <div data-testid="auth-error"
            className="bg-red-50 text-red-600 text-[13px] px-[14px] py-[10px] rounded-[10px] leading-[1.5]">
            {error}
          </div>
        )}

        <button
          data-testid="email-auth-btn"
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-700 text-white border-none rounded-full px-6 py-3 text-sm font-medium cursor-pointer hover:bg-blue-800 transition-colors mt-1 ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#d7d7d9]" />
        <span className="text-xs text-[#696a6f] whitespace-nowrap">or continue with</span>
        <div className="flex-1 h-px bg-[#d7d7d9]" />
      </div>

      {/* Social buttons */}
      <div className="flex flex-col gap-2.5">
        <div data-testid="google-login-btn" className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed')}
            theme="outline"
            size="large"
            width="356"
            text="signin_with"
            shape="pill"
          />
        </div>

        <button
          data-testid="microsoft-login-btn"
          onClick={handleMicrosoftLogin}
          disabled={loading}
          className="w-full bg-white text-[#05060f] border border-[#d7d7d9] rounded-full px-6 py-[11px] text-sm font-medium cursor-pointer hover:border-[#696a6f] transition-colors flex items-center justify-center gap-2.5"
        >
          <svg width="18" height="18" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Sign in with Microsoft
        </button>
      </div>

      {/* Switch mode */}
      <p className="text-center text-[13px] text-[#696a6f] mt-5 mb-0">
        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
        <button
          type="button"
          data-testid="toggle-auth-mode"
          onClick={() => switchMode(!isSignUp)}
          className="bg-transparent border-none cursor-pointer text-[13px] font-medium text-blue-700 hover:text-blue-800 transition-colors p-0"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </Shell>
  );
};
