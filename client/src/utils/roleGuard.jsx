import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const roleRedirects = {
  org_admin: '/org/dashboard',
  hr: '/hr/dashboard',
  employee: '/employee/dashboard',
  intern: '/intern/dashboard',
};

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    const path = location.pathname;
    if (path.startsWith('/org/')) return <Navigate to="/org/login" state={{ from: location }} replace />;
    if (path.startsWith('/hr/')) return <Navigate to="/hr/login" state={{ from: location }} replace />;
    if (path.startsWith('/intern/')) return <Navigate to="/intern/login" state={{ from: location }} replace />;
    if (path.startsWith('/employee/')) return <Navigate to="/team/login" state={{ from: location }} replace />;
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={roleRedirects[user?.role] || '/'} replace />;
  }

  return children;
}

export function AuthRedirect({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  // While the app is restoring session, keep showing the auth pages
  // so users don't see a full-screen placeholder. This avoids the dark
  // blue flash during login/signup navigation.
  if (isLoading) {
    return children;
  }
  if (isAuthenticated && user) {
    return <Navigate to={roleRedirects[user.role] || '/'} replace />;
  }
  return children;
}
