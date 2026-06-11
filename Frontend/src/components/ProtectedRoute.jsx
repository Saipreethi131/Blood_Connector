import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    const redirect =
      user.role === 'donor' ? '/donor/dashboard' :
      user.role === 'hospital' ? '/hospital/dashboard' :
      '/admin/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return children;
}
