import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/services/api';
import { PageLoader } from '@/components/common';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getMe();
        setUser(response.data);
        
        if (adminOnly && response.data.role !== 'admin') {
          navigate('/teacher/dashboard');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/teacher/login', { state: { from: location.pathname } });
      }
    };

    checkAuth();
  }, [location, navigate, adminOnly]);

  if (isAuthenticated === null) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children(user);
};
