import { useEffect } from 'react';
import { BrowserRouter } from 'react-router';
import { restoreSession } from './auth-slice';
import { useAppDispatch } from './hooks';
import { AppRoutes } from './routes/AppRoutes';

export const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(restoreSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};
