import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';
import { getApiErrorMessage } from '@/lib/handle-error';
import { GoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/msalConfig';

// ─── Design tokens (matches landing page) ─────────────────────────────────────
const T = {
  inkBlack:     '#05060f',
  blue:         '#1d4ed8',
  blueHover:    '#1e40af',
  blueLight:    '#dbeafe',
  blueText:     '#1e40af',
  cloudWhite:   '#ffffff',
  whisperGray:  '#f8f8f8',
  stoneGray:    '#696a6f',
  platinumGray: '#d7d7d9',
  errorRed:     '#dc2626',
  errorRedBg:   '#fef2f2',
  shadowXl:     'rgba(0,19,41,0.01) 0px 10px 32px 0px, rgba(0,19,41,0.02) 0px 2px 0px 0px, rgba(0,19,41,0.02) 0px 0px 24px 0px',
  shadowSm:     'rgba(5,6,15,0.04) 0px 2px 4px 0px, rgba(5,6,15,0.02) 0px 0px 5px 0px',
};

const inputStyle = {
  width: '100%',
  border: `1px solid ${T.platinumGray}`,
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 14,
  color: T.inkBlack,
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  background: T.cloudWhite,
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: T.inkBlack,
  marginBottom: 6,
};

const btnPrimary = {
  width: '100%',
  background: T.blue,
  color: T.cloudWhite,
  border: 'none',
  borderRadius: '100px',
  padding: '12px 24px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif',
  transition: 'background 0.15s',
};

const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.blue}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Shared page shell ────────────────────────────────────────────────────────
const Shell = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    background: T.whisperGray,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'Inter, system-ui, sans-serif',
  }}>
    {/* Logo */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: T.cloudWhite, fontWeight: 700, fontSize: 15 }}>B</span>
      </div>
      <span style={{ fontWeight: 700, fontSize: 17, color: T.inkBlack, letterSpacing: '-0.3px' }}>BlueAI</span>
    </div>

    {/* Card */}
    <div style={{
      background: T.cloudWhite,
      borderRadius: 20,
      boxShadow: T.shadowXl,
      width: '100%',
      maxWidth: 420,
      padding: '32px',
    }}>
      {children}
    </div>

    {/* Footer note */}
    <p style={{ marginTop: 20, fontSize: 12, color: T.stoneGray, textAlign: 'center' }}>
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
      await axios.post(`${API}/auth/forgot-password`, { email: resetEmail });
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
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckIcon />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.inkBlack, letterSpacing: '-0.3px', margin: '0 0 8px' }}>Check your email</h1>
          <p style={{ fontSize: 14, color: T.stoneGray, lineHeight: 1.65, margin: '0 0 24px' }}>
            If an account exists for that address, we've sent a password reset link.
          </p>
          <button
            onClick={() => { setSent(false); onBack(); }}
            style={{ ...btnPrimary, width: 'auto', padding: '10px 28px' }}
            onMouseEnter={e => e.currentTarget.style.background = T.blueHover}
            onMouseLeave={e => e.currentTarget.style.background = T.blue}
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.inkBlack, letterSpacing: '-0.3px', margin: '0 0 6px' }}>Reset your password</h1>
        <p style={{ fontSize: 14, color: T.stoneGray, lineHeight: 1.65, margin: 0 }}>
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Email address</label>
          <input
            data-testid="reset-email-input"
            type="email"
            required
            value={resetEmail}
            onChange={e => setResetEmail(e.target.value)}
            placeholder="you@school.org"
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = T.blue}
            onBlur={e => e.currentTarget.style.borderColor = T.platinumGray}
          />
        </div>

        {error && (
          <div data-testid="reset-error" style={{ background: T.errorRedBg, color: T.errorRed, fontSize: 13, padding: '10px 14px', borderRadius: 10, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <button
          data-testid="send-reset-btn"
          type="submit"
          disabled={loading}
          style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.blueHover; }}
          onMouseLeave={e => e.currentTarget.style.background = T.blue}
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>

        <button
          type="button"
          onClick={onBack}
          data-testid="cancel-reset-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: T.stoneGray, fontFamily: 'inherit', padding: '4px 0' }}
          onMouseEnter={e => e.currentTarget.style.color = T.inkBlack}
          onMouseLeave={e => e.currentTarget.style.color = T.stoneGray}
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
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const payload  = isSignUp
        ? { email, password, name, school_name: schoolName }
        : { email, password };
      await axios.post(`${API}${endpoint}`, payload);
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
      await axios.post(`${API}/auth/google`, {}, {
        headers: { Authorization: `Bearer ${credentialResponse.credential}` },
      });
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
      await axios.post(`${API}/auth/microsoft`, {}, {
        headers: { Authorization: `Bearer ${msalResponse.accessToken}` },
      });
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.inkBlack, letterSpacing: '-0.3px', margin: '0 0 4px' }}>
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p style={{ fontSize: 14, color: T.stoneGray, margin: 0, lineHeight: 1.6 }}>
          {isSignUp ? 'Start your BlueAI teacher account.' : 'Sign in to your teacher portal.'}
        </p>
      </div>

      {/* Tab row */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.platinumGray}`, marginBottom: 24 }}>
        {[{ label: 'Sign In', signup: false, testId: 'signin-tab' }, { label: 'Sign Up', signup: true, testId: 'signup-tab' }].map(tab => (
          <button
            key={tab.label}
            data-testid={tab.testId}
            onClick={() => switchMode(tab.signup)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              borderBottom: isSignUp === tab.signup ? `2px solid ${T.blue}` : '2px solid transparent',
              padding: '0 0 12px',
              fontSize: 14,
              fontWeight: 500,
              color: isSignUp === tab.signup ? T.blue : T.stoneGray,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isSignUp && (
          <>
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                data-testid="name-input"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = T.blue}
                onBlur={e => e.currentTarget.style.borderColor = T.platinumGray}
              />
            </div>
            <div>
              <label style={labelStyle}>
                School / Organisation{' '}
                <span style={{ fontWeight: 400, color: T.stoneGray }}>(optional)</span>
              </label>
              <input
                data-testid="school-input"
                type="text"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                placeholder="Greenfield Academy"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = T.blue}
                onBlur={e => e.currentTarget.style.borderColor = T.platinumGray}
              />
            </div>
          </>
        )}

        <div>
          <label style={labelStyle}>Email address</label>
          <input
            data-testid="email-input"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@school.org"
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = T.blue}
            onBlur={e => e.currentTarget.style.borderColor = T.platinumGray}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            {!isSignUp && (
              <button
                type="button"
                data-testid="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: T.blue, fontFamily: 'inherit', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = T.blueHover}
                onMouseLeave={e => e.currentTarget.style.color = T.blue}
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
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = T.blue}
            onBlur={e => e.currentTarget.style.borderColor = T.platinumGray}
          />
        </div>

        {error && (
          <div data-testid="auth-error" style={{ background: T.errorRedBg, color: T.errorRed, fontSize: 13, padding: '10px 14px', borderRadius: 10, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <button
          data-testid="email-auth-btn"
          type="submit"
          disabled={loading}
          style={{ ...btnPrimary, marginTop: 4, opacity: loading ? 0.7 : 1 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.blueHover; }}
          onMouseLeave={e => e.currentTarget.style.background = T.blue}
        >
          {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: T.platinumGray }} />
        <span style={{ fontSize: 12, color: T.stoneGray, whiteSpace: 'nowrap' }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: T.platinumGray }} />
      </div>

      {/* Social buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div data-testid="google-login-btn" style={{ display: 'flex', justifyContent: 'center' }}>
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
          style={{
            width: '100%',
            background: T.cloudWhite,
            color: T.inkBlack,
            border: `1px solid ${T.platinumGray}`,
            borderRadius: '100px',
            padding: '11px 24px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.stoneGray}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.platinumGray}
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
      <p style={{ textAlign: 'center', fontSize: 13, color: T.stoneGray, marginTop: 20, marginBottom: 0 }}>
        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
        <button
          type="button"
          data-testid="toggle-auth-mode"
          onClick={() => switchMode(!isSignUp)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: T.blue, fontFamily: 'inherit', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = T.blueHover}
          onMouseLeave={e => e.currentTarget.style.color = T.blue}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </Shell>
  );
};
