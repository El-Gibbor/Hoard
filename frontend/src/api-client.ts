const tokenKey = 'hoard.token';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly details?: FieldErrors;

  constructor(status: number, message: string, details?: FieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

let onUnauthorised = (): void => {};

export const setOnUnauthorised = (handler: () => void): void => {
  onUnauthorised = handler;
};

export const getToken = (): string | null => localStorage.getItem(tokenKey);

export const setToken = (token: string): void => {
  localStorage.setItem(tokenKey, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(tokenKey);
};

const readError = async (response: Response): Promise<ApiError> => {
  const body = (await response.json().catch(() => null)) as {
    error?: { message?: string; details?: FieldErrors };
  } | null;

  return new ApiError(
    response.status,
    body?.error?.message ?? 'Request failed',
    body?.error?.details,
  );
};

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    onUnauthorised();
  }

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as T;
};

export const registerAccount = (body: { name: string; email: string; password: string }) =>
  apiRequest<{ user: AuthUser; token: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const signInAccount = (body: { email: string; password: string }) =>
  apiRequest<{ user: AuthUser; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const currentAccount = () => apiRequest<{ user: AuthUser }>('/api/auth/me');
