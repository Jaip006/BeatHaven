import React from 'react';
import { IndianRupee, ShoppingCartIcon } from 'lucide-react';

type PriceButtonProps = {
  price?: number | null;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  showBuyText?: boolean;
  ariaLabel?: string;
};

const toSafePrice = (value?: number | null): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric);
};

const PriceButton: React.FC<PriceButtonProps> = ({
  price,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  showBuyText = false,
  ariaLabel = 'Beat price',
}) => {
  const safePrice = toSafePrice(price);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/10 shadow-[0_10px_24px_rgba(124,58,237,0.35)] transition-all duration-150 hover:from-[#8B5CF6] hover:to-[#A855F7] hover:shadow-[0_12px_28px_rgba(147,51,234,0.42)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
        <ShoppingCartIcon size={14} />
      <span className="inline-flex items-center">
        {showBuyText ? <span className="mr-1">Buy</span> : null}
        <IndianRupee size={13} />
        <span>{safePrice}</span>
      </span>
    </button>
  );
};

export default PriceButton;
