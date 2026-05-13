import { Navigate } from 'react-router-dom';
import { getRedirectPathByRole } from '../utils/authRedirect';

export default function RequireRole({ allowedRoles, children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const normalized = String(role || '').toUpperCase().trim();
    const allowed = allowedRoles.map((r) => String(r).toUpperCase().trim());
    if (!allowed.includes(normalized)) {
      return <Navigate to={getRedirectPathByRole(normalized)} replace />;
    }
  }

  return children;
}
