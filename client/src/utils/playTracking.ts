import { API_BASE_URL } from './apiBaseUrl';
import { getAuthSession } from './auth';
import { hasConsentFor } from './consent';

export const recordBeatPlay = async (beatId: string): Promise<Response> => {
  if (!hasConsentFor('analytics')) return new Response(null, { status: 204 });

  const headers = new Headers();
  const session = getAuthSession();

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  return fetch(`${API_BASE_URL}/beats/${beatId}/play`, {
    method: 'POST',
    headers,
  });
};
