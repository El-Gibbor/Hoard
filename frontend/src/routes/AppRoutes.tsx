import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAppSelector } from '../hooks';
import { HomePage } from '../pages/HomePage';
import { SignInPage } from '../pages/SignInPage';
import { SignUpPage } from '../pages/SignUpPage';
import { ProtectedRoute } from './ProtectedRoute';

const GuestRoute = ({ children }: { children: ReactNode }) => {
  const status = useAppSelector((state) => state.auth.status);
  const token = useAppSelector((state) => state.auth.token);

  if (status === 'loading') {
    return <p>Checking your session.</p>;
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AppRoutes = () => (
  <Routes>
    <Route
      path="/sign-in"
      element={
        <GuestRoute>
          <SignInPage />
        </GuestRoute>
      }
    />
    <Route
      path="/sign-up"
      element={
        <GuestRoute>
          <SignUpPage />
        </GuestRoute>
      }
    />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<HomePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
