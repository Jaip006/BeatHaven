import { authService } from './api';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  mobileNumber?: string;
  mobileVerified?: boolean;
  aadhaarVerified?: boolean;
  role: 'buyer' | 'seller';
  isVerified: boolean;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

const AUTH_STORAGE_KEY = 'beathaven_auth_session';
const AUTH_EVENT_NAME = 'beathaven-auth-changed';

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function getAuthSession(): AuthSession | null {
  const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export async function hydrateAuthSession(forceRefresh = false) {
  const existingSession = getAuthSession();

  if (existingSession && !forceRefresh) {
    return existingSession;
  }

  try {
    const response = await authService.refresh();
    const accessToken = response.data?.data?.accessToken as string | undefined;
    const user = response.data?.data?.user as AuthUser | undefined;

    if (!accessToken || !user) {
      return null;
    }

    const session = { accessToken, user };
    saveAuthSession(session);
    return session;
  } catch {
    if (forceRefresh) {
      clearAuthSession();
    }
    return null;
  }
}

export function subscribeToAuthChanges(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(AUTH_EVENT_NAME, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(AUTH_EVENT_NAME, callback);
  };
}

export function getUserInitials(displayName: string) {
  return displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
