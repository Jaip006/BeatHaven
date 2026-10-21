import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  getStoredConsent,
  saveConsent,
  type ConsentCategory,
  type CookieConsent,
} from '../utils/consent';
import CookieConsentDialog from '../components/privacy/CookieConsentDialog';
import { CookieConsentContext } from './cookieConsent';

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consent, setConsent] = useState<CookieConsent | null>(() => getStoredConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const persist = useCallback((categories: Record<ConsentCategory, boolean>) => {
    setConsent(saveConsent(categories));
    setPreferencesOpen(false);
  }, []);

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const value = useMemo(() => ({ consent, openPreferences }), [consent, openPreferences]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <CookieConsentDialog
        key={`${preferencesOpen}-${consent?.updatedAt ?? 'no-consent'}`}
        consent={consent}
        preferencesOpen={preferencesOpen}
        onClosePreferences={() => setPreferencesOpen(false)}
        onSave={persist}
      />
    </CookieConsentContext.Provider>
  );
};
