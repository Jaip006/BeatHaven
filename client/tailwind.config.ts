import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0B',
        card: '#121212',
        cardHover: '#1A1A1A',
        primary: '#1ED760',
        primaryHover: '#22FFA3',
        accent: '#7C5CFF',
        textPrimary: '#FFFFFF',
        textSecondary: '#B3B3B3',
        textMuted: '#6B7280',
        borderColor: '#262626',
        divider: '#2A2A2A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
