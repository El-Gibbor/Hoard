import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearToken } from '../api-client';
import { AppRoutes } from '../routes/AppRoutes';
import { createAppStore } from '../store';

describe('sign up', () => {
  afterEach(() => {
    clearToken();
    vi.unstubAllGlobals();
  });

  it('shows the server validation error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Validation failed',
            details: { email: ['Invalid email'] },
          },
        }),
      }),
    );

    render(
      <Provider store={createAppStore()}>
        <MemoryRouter initialEntries={['/sign-up']}>
          <AppRoutes />
        </MemoryRouter>
      </Provider>,
    );

    await userEvent.type(screen.getByLabelText('Name'), 'Amina');
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
  });
});
