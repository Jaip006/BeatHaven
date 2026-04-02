import { clearAuthSession, getAuthSession, hydrateAuthSession, redirectToSignIn } from './auth';

type AuthFetchInput = RequestInfo | URL;
type AuthFetchInit = RequestInit;

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

const normalizeApiBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_API_BASE_URL;
  if (/\/api\/v\d+$/i.test(trimmed)) return trimmed;
  if (/\/api$/i.test(trimmed)) return `${trimmed}/v1`;
  return `${trimmed}/api/v1`;
};

const resolveAuthFetchUrl = (input: AuthFetchInput): AuthFetchInput => {
  if (typeof input !== 'string') return input;

  const configuredBase = String(import.meta.env.VITE_API_URL ?? '').trim();
  const normalizedBase = normalizeApiBaseUrl(configuredBase || DEFAULT_API_BASE_URL);
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return normalizedBase;
  }

  if (trimmedInput.startsWith('undefined/') || trimmedInput.startsWith('null/')) {
    const cleaned = trimmedInput.replace(/^(undefined|null)\//, '');
    return `${normalizedBase}/${cleaned}`;
  }

  if (trimmedInput === 'undefined' || trimmedInput === 'null') {
    return normalizedBase;
  }

  if (trimmedInput.startsWith('undefined') || trimmedInput.startsWith('null')) {
    const cleaned = trimmedInput.replace(/^(undefined|null)/, '').replace(/^\/+/, '');
    return `${normalizedBase}/${cleaned}`;
  }

  if (trimmedInput.startsWith('/')) {
    return `${normalizedBase}${trimmedInput}`;
  }

  if (configuredBase) {
    const rawBaseNoSlash = configuredBase.replace(/\/+$/, '');
    if (trimmedInput.startsWith(rawBaseNoSlash)) {
      const rest = trimmedInput.slice(rawBaseNoSlash.length);
      return `${normalizedBase}${rest.startsWith('/') ? rest : `/${rest}`}`;
    }
  }

  return trimmedInput;
};

const withAuthHeader = (init: AuthFetchInit, token: string): AuthFetchInit => {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return {
    ...init,
    headers,
  };
};

export async function authFetch(input: AuthFetchInput, init: AuthFetchInit = {}): Promise<Response> {
  const resolvedInput = resolveAuthFetchUrl(input);
  let session = getAuthSession();
  if (!session) {
    session = await hydrateAuthSession();
  }

  const token = session?.accessToken;
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  let response = await fetch(resolvedInput, withAuthHeader(init, token));

  if (response.status === 401) {
    const refreshedSession = await hydrateAuthSession(true);
    const refreshedToken = refreshedSession?.accessToken;

    if (!refreshedToken) {
      clearAuthSession();
      redirectToSignIn('session_expired');
      return response;
    }

    response = await fetch(resolvedInput, withAuthHeader(init, refreshedToken));
  }

  return response;
}
