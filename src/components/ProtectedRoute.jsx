import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'kasir':
        return <Navigate to="/kasir/pos" replace />;
      case 'owner':
        return <Navigate to="/owner/reports" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
