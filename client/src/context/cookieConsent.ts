import { createContext } from 'react';
import type { CookieConsent } from '../utils/consent';

export interface CookieConsentContextValue {
  consent: CookieConsent | null;
  openPreferences: () => void;
}

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);
