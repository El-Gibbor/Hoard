import { Navigate, Outlet, useLocation } from 'react-router';
import { useAppSelector } from '../hooks';

export const ProtectedRoute = () => {
  const status = useAppSelector((state) => state.auth.status);
  const token = useAppSelector((state) => state.auth.token);
  const location = useLocation();

  if (status === 'loading') {
    return <p>Checking your session.</p>;
  }

  if (!token) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
