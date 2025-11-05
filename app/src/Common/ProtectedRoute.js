import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authState.loading) {
      if (!authState.isAuthenticated) {
        navigate('/', { state: { from: location }, replace: true });
      } else if (allowedRoles && !allowedRoles.includes(authState.userType)) {
        navigate('/', { replace: true });
      }
    }
  }, [authState, navigate, location, allowedRoles]);

  if (authState.loading) {
    return null;
  }

  return authState.isAuthenticated &&
  (!allowedRoles || allowedRoles.includes(authState.userType))
    ? children
    : null;
};