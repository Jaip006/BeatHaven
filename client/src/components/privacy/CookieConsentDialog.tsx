import { useEffect, useRef, useState } from 'react';
import { BarChart3, Cookie, LockKeyhole, Megaphone, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  defaultConsentCategories,
  type ConsentCategory,
  type CookieConsent,
} from '../../utils/consent';

interface CookieConsentDialogProps {
  consent: CookieConsent | null;
  preferencesOpen: boolean;
  onClosePreferences: () => void;
  onSave: (categories: Record<ConsentCategory, boolean>) => void;
}

const optionalCategories: Array<{ key: ConsentCategory; title: string; description: string; icon: typeof BarChart3 }> = [
  { key: 'analytics', title: 'Analytics', description: 'Helps us understand which beats and features perform well.', icon: BarChart3 },
  { key: 'advertising', title: 'Advertising', description: 'Supports relevant BeatHaven promotions if advertising tools are enabled.', icon: Megaphone },
  { key: 'preferences', title: 'Preferences', description: 'Lets us remember optional personalization choices and recommendations.', icon: Sparkles },
];

const allOptionalEnabled = (): Record<ConsentCategory, boolean> => ({ analytics: true, advertising: true, preferences: true });

const CookieConsentDialog = ({ consent, preferencesOpen, onClosePreferences, onSave }: CookieConsentDialogProps) => {
  const [preferences, setPreferences] = useState<Record<ConsentCategory, boolean>>(() => consent?.categories ?? defaultConsentCategories());
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const requiresChoice = !consent;
  const isOpen = requiresChoice || preferencesOpen;
  const isSettings = preferencesOpen;

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>('button, a[href], input:not([disabled])');
      firstFocusable?.focus();
      return;
    }

    previousFocusRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSettings) onClosePreferences();
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], input:not([disabled])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSettings, onClosePreferences]);

  if (!isOpen) return null;

  const handleReject = () => onSave(defaultConsentCategories());
  const handleAcceptAll = () => onSave(allOptionalEnabled());
  const updatePreference = (category: ConsentCategory) => {
    setPreferences((current) => ({ ...current, [category]: !current[category] }));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
        aria-describedby="cookie-consent-description"
        className="w-full border-t border-[#3A3A3A] bg-[#101010]/95 shadow-[0_-16px_50px_rgba(0,0,0,0.48)] backdrop-blur-xl"
      >
        {!isSettings ? (
          <div className="grid w-full items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] shadow-[0_0_20px_rgba(30,215,96,0.2)]">
                <Cookie size={18} aria-hidden="true" className="text-[#0B0B0B]" />
              </div>
              <div className="min-w-0">
                <p id="cookie-consent-description" className="text-xs leading-5 text-[#A3A3A3] sm:text-sm">
                  We use essential cookies to run BeatHaven. Optional cookies help improve your experience.{' '}
                  <Link to="/privacy" className="font-semibold text-[#1ED760] underline underline-offset-2 outline-none transition hover:text-[#22FFA3] sm:whitespace-nowrap">Privacy Policy</Link>
                </p>
              </div>
            </div>
            <div className="grid w-full max-w-[330px] justify-self-center grid-cols-2 gap-2 sm:max-w-none sm:justify-self-auto lg:min-w-[280px] lg:w-auto">
              <button type="button" onClick={handleAcceptAll} className="min-h-10 rounded-lg bg-[#1ED760] px-2.5 py-2 text-sm font-bold text-[#0B0B0B] transition hover:bg-[#22FFA3] focus:outline-none focus:ring-2 focus:ring-[#22FFA3] focus:ring-offset-2 focus:ring-offset-[#121212]">Accept All</button>
              <button type="button" onClick={handleReject} className="min-h-10 rounded-lg border border-[#4A4A4A] px-2.5 py-2 text-sm font-bold text-[#E5E5E5] transition hover:border-[#777777] hover:bg-[#1A1A1A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1ED760] focus:ring-offset-2 focus:ring-offset-[#121212]">Reject Optional</button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1ED760]/10 text-[#1ED760]"><SlidersHorizontal size={23} aria-hidden="true" /></div>
              <div>
                <h2 id="cookie-consent-title" className="text-2xl font-black tracking-tight text-white">Cookie preferences</h2>
                <p id="cookie-consent-description" className="mt-1 text-sm leading-6 text-[#B3B3B3]">Choose which optional technologies BeatHaven may use. None are enabled unless you select them.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-4">
                <LockKeyhole size={19} aria-hidden="true" className="shrink-0 text-[#1ED760]" />
                <div className="min-w-0 flex-1"><p className="text-sm font-bold text-white">Strictly necessary</p><p className="mt-1 text-xs leading-5 text-[#8A8A8A]">Required for security, sign-in, cart, checkout, and core playback.</p></div>
                <span className="rounded-full bg-[#1ED760]/15 px-2.5 py-1 text-xs font-bold text-[#1ED760]">Always on</span>
              </div>
              {optionalCategories.map(({ key, title, description, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3 rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D] p-4">
                  <Icon size={19} aria-hidden="true" className="shrink-0 text-[#A799FF]" />
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-[#8A8A8A]">{description}</p></div>
                  <button type="button" role="switch" aria-checked={preferences[key]} aria-label={`${preferences[key] ? 'Disable' : 'Enable'} ${title}`} onClick={() => updatePreference(key)} className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#1ED760] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] ${preferences[key] ? 'bg-[#1ED760]' : 'bg-[#3A3A3A]'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${preferences[key] ? 'left-6' : 'left-1'}`} /></button>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={handleAcceptAll} className="order-1 rounded-xl bg-[#1ED760] px-4 py-3 text-sm font-bold text-[#0B0B0B] transition hover:bg-[#22FFA3] focus:outline-none focus:ring-2 focus:ring-[#22FFA3] focus:ring-offset-2 focus:ring-offset-[#121212]">Accept All</button>
              <button type="button" onClick={handleReject} className="order-2 rounded-xl border border-[#505050] px-4 py-3 text-sm font-bold text-white transition hover:border-[#B3B3B3] hover:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1ED760] focus:ring-offset-2 focus:ring-offset-[#121212]">Reject Optional</button>
              <button type="button" onClick={() => onSave(preferences)} className="order-3 rounded-xl border border-[#7C5CFF]/60 px-4 py-3 text-sm font-bold text-[#C5B8FF] transition hover:bg-[#7C5CFF]/10 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] focus:ring-offset-2 focus:ring-offset-[#121212]">Save Preferences</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentDialog;
