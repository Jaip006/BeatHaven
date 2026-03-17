import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants: Record<string, string> = {
    default: 'bg-[#1A1A1A] text-[#B3B3B3] border border-[#262626]',
    primary: 'bg-[#1ED760]/10 text-[#1ED760] border border-[#1ED760]/30',
    accent: 'bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/30',
    outline: 'bg-transparent text-[#B3B3B3] border border-[#262626]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
