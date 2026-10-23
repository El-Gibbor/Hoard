import { useNavigate } from 'react-router';
import { clearToken } from '../api-client';
import { clearSession } from '../auth-slice';
import { useAppDispatch, useAppSelector } from '../hooks';

export const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const name = useAppSelector((state) => state.auth.user?.name);

  const onSignOut = () => {
    clearToken();
    dispatch(clearSession());
    navigate('/sign-in');
  };

  return (
    <main className="card">
      <h1>Hoard</h1>
      <p>Signed in as {name ?? 'your account'}.</p>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </main>
  );
};
