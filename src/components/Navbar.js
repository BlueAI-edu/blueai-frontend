import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  FileQuestion,
  ClipboardList,
  Users,
  FileText,
  CheckSquare,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Questions', path: '/teacher/questions', icon: FileQuestion },
  { label: 'Assessments', path: '/teacher/assessments', icon: ClipboardList },
  { label: 'Classes', path: '/teacher/classes', icon: Users },
  { label: 'Submissions', path: '/teacher/assessments', icon: FileText },
  { label: 'Marking', path: '/teacher/ocr-upload', icon: CheckSquare },
  { label: 'Analytics', path: '/teacher/analytics', icon: BarChart3 },
];

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
};

export const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef(null);

  const isActive = (path) => {
    if (path === '/teacher/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await authApi.logout();
    } catch (_) {}
    navigate('/teacher/login');
  };

  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Teacher';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileOpen && mobileRef.current && !mobileRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* ── Desktop / Tablet Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="flex items-center gap-2 shrink-0"
                data-testid="nav-logo"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">BlueAI</span>
              </button>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1" data-testid="nav-links">
                {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <button
                      key={path}
                      onClick={() => navigate(path)}
                      data-testid={`nav-${label.toLowerCase()}`}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                      {label}
                      {active && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-full" />
                      )}
                    </button>
                  );
                })}
                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    data-testid="nav-admin"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      location.pathname.startsWith('/admin')
                        ? 'text-purple-700 bg-purple-50'
                        : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </button>
                )}
              </nav>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-3">
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    data-testid="nav-profile-trigger"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.picture || user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
                      <p className="text-xs text-gray-500 leading-tight">{roleLabel}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-gray-500 font-normal">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/teacher/profile')}
                    data-testid="dropdown-profile"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile & Settings
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/admin/dashboard')}
                      data-testid="dropdown-admin"
                      className="text-purple-700 focus:text-purple-700 focus:bg-purple-50"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    data-testid="dropdown-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="nav-mobile-toggle"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Nav Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            ref={mobileRef}
            className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="px-4 py-3 space-y-1" data-testid="mobile-nav-links">
              {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setMobileOpen(false);
                    }}
                    data-testid={`mobile-nav-${label.toLowerCase()}`}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}

              {/* Admin link — mobile, only for admins */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    navigate('/admin/dashboard');
                    setMobileOpen(false);
                  }}
                  data-testid="mobile-nav-admin"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'text-purple-700 bg-purple-50'
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  Admin Panel
                </button>
              )}

              {/* Mobile profile block */}
              <div className="pt-3 mt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.picture || user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
                  </div>
                </div>
                <div className="space-y-1 mt-2">
                  <button
                    onClick={() => {
                      navigate('/teacher/profile');
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-400" />
                    Profile & Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
