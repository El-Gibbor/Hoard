import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, clearToken, getToken, setOnUnauthorised, setToken } from './api-client';

describe('api client', () => {
  afterEach(() => {
    clearToken();
    setOnUnauthorised(() => {});
    vi.unstubAllGlobals();
  });

  it('sends the stored token on a request', async () => {
    setToken('signed-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: '1' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/api/auth/me');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get('Authorization')).toBe('Bearer signed-token');
  });

  it('clears the token and signs out when the server returns 401', async () => {
    setToken('expired-token');
    const onUnauthorised = vi.fn();
    setOnUnauthorised(onUnauthorised);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Missing or invalid token' } }),
      }),
    );

    await expect(apiRequest('/api/auth/me')).rejects.toThrow('Missing or invalid token');
    expect(getToken()).toBeNull();
    expect(onUnauthorised).toHaveBeenCalledOnce();
  });
});
