import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

// Goes inside <RequireAuth>, so there is always a user here
export default function RequireRole({ roles }) {
  const { user } = useAuth();

  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
