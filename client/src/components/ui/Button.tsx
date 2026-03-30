import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B] disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs sm:px-4 sm:text-sm',
    md: 'px-4 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm',
    lg: 'px-6 py-3 text-sm sm:px-8 sm:py-3.5 sm:text-base',
  };

  const variants: Record<string, string> = {
    primary:
      'bg-[#1ED760] text-[#0B0B0B] hover:bg-[#22FFA3] hover:scale-105 active:scale-100 focus-visible:ring-[#1ED760] shadow-[0_0_20px_rgba(30,215,96,0.25)] hover:shadow-[0_0_30px_rgba(30,215,96,0.45)]',
    secondary:
      'bg-[#121212] text-white border border-[#262626] hover:bg-[#1A1A1A] hover:border-[#1ED760] hover:scale-105 active:scale-100 focus-visible:ring-[#262626]',
    outline:
      'bg-transparent text-[#1ED760] border border-[#1ED760] hover:bg-[#1ED760] hover:text-[#0B0B0B] hover:scale-105 active:scale-100 focus-visible:ring-[#1ED760]',
    ghost:
      'bg-transparent text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] focus-visible:ring-[#262626]',
    accent:
      'bg-[#7C5CFF] text-white hover:bg-[#6a4de0] hover:scale-105 active:scale-100 focus-visible:ring-[#7C5CFF] shadow-[0_0_20px_rgba(124,92,255,0.25)] hover:shadow-[0_0_30px_rgba(124,92,255,0.45)]',
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
