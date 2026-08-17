import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/services/api';
import { PageLoader } from '@/components/common';

export const ProtectedRoute = ({ children, adminOnly = false, roles = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getMe();
        setUser(response.data);
        const role = response.data.role;

        if (adminOnly && role !== 'admin') {
          navigate(role === 'school_admin' ? '/school-admin' : '/teacher/dashboard');
          return;
        }

        // Explicit role allow-list (e.g. the school-admin console)
        if (roles && !roles.includes(role)) {
          navigate(role === 'school_admin' ? '/school-admin' : '/teacher/dashboard');
          return;
        }

        // school_admin has no teacher surface — keep them on their console
        // unless the route explicitly allows them
        if (!roles && role === 'school_admin') {
          navigate('/school-admin');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/teacher/login', { state: { from: location.pathname } });
      }
    };

    checkAuth();
  }, [location, navigate, adminOnly, roles]);

  if (isAuthenticated === null) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children(user);
};
