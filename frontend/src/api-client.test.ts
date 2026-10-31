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

describe('api base URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  // The base URL is read when the module loads, so each case imports a fresh copy
  const requestedUrl = async (): Promise<string> => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const client = await import('./api-client');

    await client.apiRequest('/api/health');

    return (fetchMock.mock.calls[0] as [string])[0];
  };

  it('calls the same origin when VITE_API_URL is empty', async () => {
    vi.stubEnv('VITE_API_URL', '');

    expect(await requestedUrl()).toBe('/api/health');
  });

  it('falls back to the local API when VITE_API_URL is unset', async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    expect(await requestedUrl()).toBe('http://localhost:4000/api/health');
  });
});
