import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0F172A',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#334155',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0369A1',
          hover: '#0284C7',
          foreground: '#FFFFFF',
        },
        background: '#F8FAFC',
        foreground: '#020617',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#020617',
        },
        muted: {
          DEFAULT: '#E8ECF1',
          foreground: '#475569',
        },
        border: '#E2E8F0',
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
      },
      boxShadow: {
        'accessible-sm': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        'accessible-md': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
