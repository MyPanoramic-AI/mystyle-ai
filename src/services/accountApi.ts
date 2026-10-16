export class AccountApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AccountApiError';
  }
}

export interface AuthResult {
  userId: string;
  csrfToken: string;
}

export interface SessionResponse extends AuthResult {
  email: string;
  expiresAt: string;
}

export interface AccountApi {
  health(): Promise<{ ok: boolean; database: string }>;
  session(): Promise<SessionResponse>;
  register(email: string, password: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  getProfile(): Promise<Record<string, unknown>>;
  saveProfile(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  getPreferences(): Promise<Record<string, unknown>>;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  csrf?: boolean;
}

export function createAccountApi(options?: { baseUrl?: string; fetchImpl?: typeof fetch }): AccountApi {
  const baseUrl = options?.baseUrl ?? '';
  const fetchImpl = options?.fetchImpl ?? fetch;
  let csrfToken: string | null = null;

  function remember<T extends { csrfToken: string }>(payload: T): T {
    csrfToken = payload.csrfToken;
    return payload;
  }

  async function request<T>(path: string, requestOptions: RequestOptions = {}, allowCsrfRetry = true): Promise<T> {
    const method = requestOptions.method ?? 'GET';
    const headers: Record<string, string> = {};
    if (requestOptions.body !== undefined) headers['content-type'] = 'application/json';
    if (requestOptions.csrf && csrfToken) headers['x-csrf-token'] = csrfToken;
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers,
        body: requestOptions.body !== undefined ? JSON.stringify(requestOptions.body) : undefined,
      });
    } catch {
      throw new AccountApiError('network_error', 'The account service could not be reached.', 0);
    }
    const text = await response.text();
    let payload: { code?: string; message?: string; csrfToken?: string } = {};
    if (text) {
      try {
        payload = JSON.parse(text) as typeof payload;
      } catch {
        throw new AccountApiError('invalid_response', 'The account service returned an unexpected response.', response.status);
      }
    }
    if (response.status === 403 && payload.code === 'invalid_csrf' && allowCsrfRetry) {
      const session = await request<SessionResponse>('/api/auth/session');
      remember(session);
      return request<T>(path, requestOptions, false);
    }
    if (!response.ok) {
      throw new AccountApiError(payload.code ?? 'request_failed', payload.message ?? 'The request was not accepted.', response.status);
    }
    return payload as T;
  }

  return {
    health: () => request('/api/health'),
    session: async () => remember(await request<SessionResponse>('/api/auth/session')),
    register: async (email, password) => remember(await request<AuthResult>('/api/auth/register', { method: 'POST', body: { email, password } })),
    login: async (email, password) => remember(await request<AuthResult>('/api/auth/login', { method: 'POST', body: { email, password } })),
    logout: async () => {
      await request('/api/auth/logout', { method: 'POST', csrf: true });
      csrfToken = null;
    },
    getProfile: () => request('/api/profile'),
    saveProfile: (body) => request('/api/profile', { method: 'PUT', body, csrf: true }),
    getPreferences: () => request('/api/preferences'),
  };
}

export const accountApi = createAccountApi();
