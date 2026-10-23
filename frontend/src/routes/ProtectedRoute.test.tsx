import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearToken, setToken } from '../api-client';
import { AppRoutes } from './AppRoutes';
import { createAppStore } from '../store';

const renderAt = (path: string, store: ReturnType<typeof createAppStore>) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );

describe('protected routes', () => {
  beforeEach(() => {
    clearToken();
  });

  it('redirects a signed-out user to sign-in', () => {
    renderAt('/', createAppStore());

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('clears the token when the signed-in user signs out', async () => {
    setToken('signed-token');
    const store = createAppStore();
    store.dispatch({
      type: 'auth/restore/fulfilled',
      payload: {
        token: 'signed-token',
        user: { id: '1', name: 'Amina', email: 'amina@example.com', role: 'USER' },
      },
    });

    renderAt('/', store);
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(localStorage.getItem('hoard.token')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});
