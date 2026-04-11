import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { IndianRupee, ShoppingCart, X } from 'lucide-react';
import type { Beat } from '../../types';
import { useCart } from '../../context/CartContext';

type LicenseKey = 'wav' | 'wav_stems' | 'exclusive';

type LicenseRow = {
  label: string;
  value: string;
  hasInfo?: boolean;
};

type LicenseConfig = {
  key: LicenseKey;
  label: string;
  multiplier: number;
  activeClassName: string;
  rows: LicenseRow[];
};

const LICENSES: LicenseConfig[] = [
  {
    key: 'wav',
    label: 'WAV',
    multiplier: 1,
    activeClassName: 'bg-gradient-to-r from-[#1ED760] to-[#7C5CFF] text-white',
    rows: [
      { label: 'Sample Info', value: 'No Sample used', hasInfo: true },
      { label: 'License Period', value: 'Indefinite' },
      { label: 'No. of Master Recordings', value: 'Unlimited', hasInfo: true },
      { label: 'Publishing Rights', value: '0% with the seller', hasInfo: true },
    ],
  },
  {
    key: 'wav_stems',
    label: 'WAV + STEMS',
    multiplier: 2,
    activeClassName: 'bg-gradient-to-r from-[#1ED760] to-[#7C5CFF] text-white',
    rows: [
      { label: 'Sample Info', value: 'No Sample used', hasInfo: true },
      { label: 'License Period', value: 'Indefinite' },
      { label: 'No. of Master Recordings', value: 'Unlimited', hasInfo: true },
      { label: 'Publishing Rights', value: '20% with the seller', hasInfo: true },
    ],
  },
  {
    key: 'exclusive',
    label: 'EXCLUSIVE',
    multiplier: 5,
    activeClassName: 'bg-gradient-to-r from-[#1ED760] to-[#7C5CFF] text-white',
    rows: [
      { label: 'Sample Info', value: 'No Sample used', hasInfo: true },
      { label: 'License Period', value: 'Indefinite' },
      { label: 'No. of Master Recordings', value: 'Unlimited', hasInfo: true },
      { label: 'Publishing Rights', value: '10% with the seller', hasInfo: true },
    ],
  },
];

type LicensePurchaseModalProps = {
  beat: Beat;
  isOpen: boolean;
  onClose: () => void;
};

const toSafePrice = (value: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric);
};

const LicensePurchaseModal: React.FC<LicensePurchaseModalProps> = ({
  beat,
  isOpen,
  onClose,
}) => {
  const [selected, setSelected] = useState<LicenseKey>('wav');
  const { addToCart } = useCart();

  const handleClose = useCallback(() => {
    setSelected('wav');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, handleClose]);

  const selectedLicense = useMemo(
    () => LICENSES.find((license) => license.key === selected) ?? LICENSES[0],
    [selected],
  );

  const basePrice = toSafePrice(beat.price);
  const finalPrice = Math.round(basePrice * selectedLicense.multiplier);

  const handleAddToCart = useCallback(() => {
    addToCart({ ...beat, price: finalPrice });
    handleClose();
  }, [addToCart, beat, finalPrice, handleClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Select License Type"
    >
      <div
        className="relative isolate mx-auto max-h-[calc(100dvh-1rem)] w-full max-w-[850px] overflow-hidden rounded-2xl border border-[#262626] bg-[#080808] shadow-[0_24px_72px_rgba(0,0,0,0.88)] sm:max-h-[calc(100dvh-2rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex max-h-[calc(100dvh-1rem)] flex-col lg:max-h-[calc(100dvh-2rem)] lg:flex-row">
          <aside className="border-b border-[#252525] bg-[#0E0E0E] p-3 sm:p-5 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-6">
            <h2 className="text-lg font-bold text-white sm:text-2xl lg:text-3xl">Select License Type</h2>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-5 lg:mt-6 lg:grid-cols-1 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-[#2A2A2A]">
              {LICENSES.map((license) => {
                const active = selected === license.key;
                return (
                  <button
                    key={license.key}
                    type="button"
                    onClick={() => setSelected(license.key)}
                    className={`flex min-h-11 w-full items-center justify-center rounded-lg px-2 text-[11px] font-semibold tracking-wide sm:text-sm lg:h-14 lg:rounded-none lg:border-b lg:border-[#2A2A2A] lg:px-3 lg:text-base lg:last:border-b-0 ${
                      active
                        ? `${license.activeClassName} shadow-[0_0_0_1px_rgba(124,92,255,0.35)] lg:shadow-none`
                        : 'bg-[#1A1B20] text-[#E2E2E2] hover:bg-[#24252B]'
                    }`}
                  >
                    {license.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-0 flex-1 flex-col bg-[#0D0D0D] p-3 sm:p-5 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#1E1E22] sm:h-16 sm:w-16">
                  {beat.coverImage ? (
                    <img src={beat.coverImage} alt={beat.title} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-white sm:text-xl lg:text-2xl">{beat.title}</h3>
                  <p className="truncate text-xs text-[#A5A5A5] sm:text-sm">{beat.producerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#CFCFCF] transition-colors hover:bg-[#24252B] hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-[#262626] bg-[#121212] p-3 sm:mt-5 sm:p-5">
              <div className="space-y-2 text-sm sm:space-y-3 sm:text-base">
                {selectedLicense.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-3  px-3 py-2"
                  >
                    <div className="text-[#E1E1E1]">
                      <span className="inline-flex items-center gap-1.5">{row.label}</span>
                    </div>
                    <div className="text-right font-semibold text-white">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex justify-end sm:mt-6">
              <button
                type="button"
                onClick={handleAddToCart}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-[#1ED760] to-[#7C5CFF] px-4 py-3 text-lg font-bold text-white shadow-[0_10px_28px_rgba(124,92,255,0.35)] transition-all hover:brightness-105 active:scale-[0.99] sm:min-w-[220px] sm:w-auto sm:text-2xl"
              >
                <ShoppingCart size={20}/>
                <IndianRupee size={18} />
                {finalPrice.toLocaleString('en-IN')}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LicensePurchaseModal;
