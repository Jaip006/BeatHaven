import { API_BASE_URL } from './apiBaseUrl';
import { getAuthSession } from './auth';

export const recordBeatPlay = async (beatId: string): Promise<Response> => {
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
