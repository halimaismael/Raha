import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: '#0B4F4A',
        oceanDark: '#063431',
        lagoon: '#17B6A7',
        coral: '#F0784B',
        ylang: '#F2B705',
        sand: '#FBF6EC',
        sandDeep: '#F0E8D6',
        charcoal: '#1B2A2A',
        slate: '#5B6B6A',
        line: '#E1D9C8',
      },
      borderRadius: { xl2: '22px' },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(27, 42, 42, 0.04), 0 8px 24px -12px rgba(27, 42, 42, 0.12)',
        card: '0 1px 2px rgba(27, 42, 42, 0.04), 0 1px 1px rgba(27, 42, 42, 0.03)',
      },
    },
  },
  plugins: [],
};
export default config;
