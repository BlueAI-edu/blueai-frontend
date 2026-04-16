import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config';

export const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (_) {}
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/teacher/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const linkClass = (path) =>
    `px-3 py-1 rounded text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
    }`;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-14">
        {/* Logo + Links */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors mr-4"
            data-testid="nav-logo"
          >
            BlueAI
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/teacher/dashboard')} className={linkClass('/teacher/dashboard')} data-testid="nav-dashboard">
              Dashboard
            </button>
            <button onClick={() => navigate('/teacher/questions')} className={linkClass('/teacher/questions')} data-testid="nav-questions">
              Questions
            </button>
            <button onClick={() => navigate('/teacher/assessments')} className={linkClass('/teacher/assessments')} data-testid="nav-assessments">
              Assessments
            </button>
            <button onClick={() => navigate('/teacher/classes')} className={linkClass('/teacher/classes')} data-testid="nav-classes">
              Classes
            </button>
            <button onClick={() => navigate('/teacher/analytics')} className={linkClass('/teacher/analytics')} data-testid="nav-analytics">
              Analytics
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin/dashboard')} className={linkClass('/admin/dashboard')} data-testid="nav-admin">
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Right side: user + logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/profile')}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            data-testid="nav-profile"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {user?.name}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-600 transition-colors"
            data-testid="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
