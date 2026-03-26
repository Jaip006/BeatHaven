import { getAuthSession, hydrateAuthSession } from './auth';

type AuthFetchInput = RequestInfo | URL;
type AuthFetchInit = RequestInit;

const withAuthHeader = (init: AuthFetchInit, token: string): AuthFetchInit => {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return {
    ...init,
    headers,
  };
};

export async function authFetch(input: AuthFetchInput, init: AuthFetchInit = {}): Promise<Response> {
  let session = getAuthSession();
  if (!session) {
    session = await hydrateAuthSession();
  }

  const token = session?.accessToken;
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  let response = await fetch(input, withAuthHeader(init, token));

  if (response.status === 401) {
    const refreshedSession = await hydrateAuthSession(true);
    const refreshedToken = refreshedSession?.accessToken;

    if (!refreshedToken) {
      return response;
    }

    response = await fetch(input, withAuthHeader(init, refreshedToken));
  }

  return response;
}

