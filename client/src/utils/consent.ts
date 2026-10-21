export const CONSENT_POLICY_VERSION = '2026-10-01';
export const CONSENT_STORAGE_KEY = 'beathaven-cookie-consent';
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export type ConsentCategory = 'analytics' | 'advertising' | 'preferences';

export interface CookieConsent {
  policyVersion: string;
  updatedAt: string;
  expiresAt: string;
  categories: Record<ConsentCategory, boolean>;
}

export const defaultConsentCategories = (): Record<ConsentCategory, boolean> => ({
  analytics: false,
  advertising: false,
  preferences: false,
});

const isValidConsent = (value: unknown): value is CookieConsent => {
  if (!value || typeof value !== 'object') return false;

  const consent = value as Partial<CookieConsent>;
  return consent.policyVersion === CONSENT_POLICY_VERSION
    && typeof consent.expiresAt === 'string'
    && Date.parse(consent.expiresAt) > Date.now()
    && typeof consent.categories?.analytics === 'boolean'
    && typeof consent.categories?.advertising === 'boolean'
    && typeof consent.categories?.preferences === 'boolean';
};

export const getStoredConsent = (): CookieConsent | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!storedValue) return null;

    const consent: unknown = JSON.parse(storedValue);
    if (isValidConsent(consent)) return consent;

    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  }

  return null;
};

export const saveConsent = (categories: Record<ConsentCategory, boolean>): CookieConsent => {
  const now = new Date();
  const consent: CookieConsent = {
    policyVersion: CONSENT_POLICY_VERSION,
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CONSENT_MAX_AGE_MS).toISOString(),
    categories,
  };

  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent<CookieConsent>('beathaven:consent-changed', { detail: consent }));
  return consent;
};

export const hasConsentFor = (category: ConsentCategory): boolean => Boolean(getStoredConsent()?.categories[category]);
