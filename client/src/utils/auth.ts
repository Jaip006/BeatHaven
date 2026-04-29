import { authService } from './api';
import axios from 'axios';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  mobileNumber?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string | null;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pin?: string;
  };
  payoutBank?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
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
const LAST_ACTIVITY_STORAGE_KEY = 'beathaven_last_activity_at';
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

const hasWindow = () => typeof window !== 'undefined';

const getLastActivityAt = (): number | null => {
  if (!hasWindow()) return null;
  const rawValue = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
  if (!rawValue) return null;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
};

const setLastActivityAt = (timestamp = Date.now()) => {
  if (!hasWindow()) return;
  localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(timestamp));
};

export const hasInactivityExpired = (timestamp = Date.now()): boolean => {
  const lastActivityAt = getLastActivityAt();
  if (typeof lastActivityAt !== 'number') {
    return false;
  }
  return timestamp - lastActivityAt > INACTIVITY_TIMEOUT_MS;
};

export const recordAuthActivity = () => {
  if (!getAuthSession()) {
    return;
  }
  setLastActivityAt();
};

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  setLastActivityAt();
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
  localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function redirectToSignIn(reason?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!reason) {
    if (window.location.pathname === '/sign-in') {
      return;
    }

    window.location.assign('/sign-in');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const reasonParam = params.get('reason');

  if (window.location.pathname === '/sign-in' && reasonParam === reason) {
    return;
  }

  window.location.assign(`/sign-in?reason=${encodeURIComponent(reason)}`);
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
  } catch (apiError) {
    if (forceRefresh) {
      clearAuthSession();

      if (axios.isAxiosError(apiError)) {
        const errorCode = apiError.response?.data?.error?.code as string | undefined;
        if (errorCode === 'SESSION_INACTIVE') {
          redirectToSignIn();
        }
      }
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

export function startInactivityLogoutMonitor() {
  if (!hasWindow()) {
    return () => undefined;
  }

  const touchActivity = () => {
    const now = Date.now();
    const lastActivityAt = getLastActivityAt();
    if (!lastActivityAt || now - lastActivityAt > 15_000) {
      recordAuthActivity();
    }
  };

  const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/reset-password', '/community', '/seller-agreement'];

  const enforceInactivityTimeout = () => {
    if (!getAuthSession()) {
      return;
    }
    if (!hasInactivityExpired()) {
      return;
    }
    clearAuthSession();

    const isPublicPath = PUBLIC_PATHS.includes(window.location.pathname)
      || window.location.pathname.startsWith('/beats/');
    if (isPublicPath) {
      return;
    }

    redirectToSignIn('inactive');
  };

  if (getAuthSession() && !getLastActivityAt()) {
    setLastActivityAt();
  }

  enforceInactivityTimeout();

  const events: Array<keyof WindowEventMap> = [
    'click',
    'keydown',
    'mousemove',
    'scroll',
    'touchstart',
  ];
  events.forEach((eventName) => window.addEventListener(eventName, touchActivity, { passive: true }));
  const intervalId = window.setInterval(enforceInactivityTimeout, 30_000);

  return () => {
    events.forEach((eventName) => window.removeEventListener(eventName, touchActivity));
    window.clearInterval(intervalId);
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
