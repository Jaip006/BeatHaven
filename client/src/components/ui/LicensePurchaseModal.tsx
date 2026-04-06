import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { IndianRupee, Info, ShoppingCart, X } from 'lucide-react';
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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Select License Type"
    >
      <div
        className="relative isolate mx-auto w-full max-w-[850px] overflow-hidden rounded-2xl border border-[#262626] bg-[#080808] shadow-[0_24px_72px_rgba(0,0,0,0.88)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col lg:flex-row">
          <aside className="border-b border-[#252525] bg-[#0E0E0E] p-5 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-6">
            <h2 className="text-3xl font-bold text-white">Select License Type</h2>

            <div className="mt-6 overflow-hidden rounded-xl border border-[#2A2A2A]">
              {LICENSES.map((license) => {
                const active = selected === license.key;
                return (
                  <button
                    key={license.key}
                    type="button"
                    onClick={() => setSelected(license.key)}
                    className={`flex h-14 w-full items-center justify-center border-b border-[#2A2A2A] px-3 text-base font-semibold tracking-wide last:border-b-0 ${
                      active ? license.activeClassName : 'bg-[#1A1B20] text-[#E2E2E2] hover:bg-[#24252B]'
                    }`}
                  >
                    {license.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-[430px] flex-1 flex-col bg-[#0D0D0D] p-5 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#1E1E22]">
                  {beat.coverImage ? (
                    <img src={beat.coverImage} alt={beat.title} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-bold text-white">{beat.title}</h3>
                  <p className="truncate text-sm text-[#A5A5A5]">{beat.producerName}</p>
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

            <div className="mt-5 flex-1 rounded-xl border border-[#262626] bg-[#121212] p-5">
              <div className="grid grid-cols-1 gap-y-5 text-md sm:grid-cols-2">
                {selectedLicense.rows.map((row) => (
                  <React.Fragment key={row.label}>
                    <div className="font-small text-[#E1E1E1]">
                      <span className="inline-flex items-center gap-1.5">
                        {row.label}                      </span>
                      <span className="ml-1.5">:</span>
                    </div>
                    <div className="font-semibold text-white sm:text-right">{row.value}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleAddToCart}
                className="inline-flex min-w-[220px] items-center justify-center gap-0.8 rounded-lg bg-gradient-to-r from-[#1ED760] to-[#7C5CFF] px-4 py-3 text-2xl font-bold text-white shadow-[0_10px_28px_rgba(124,92,255,0.35)] transition-all hover:brightness-105 active:scale-[0.99]"
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
