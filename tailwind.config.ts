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
        sans: ['var(--font-sans)', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['var(--font-display)', 'Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: {
          DEFAULT: '#FAF8F3',
          subtle: '#F4F1EA',
          dark: '#141518',
        },
        charcoal: {
          DEFAULT: '#191A1E',
          soft: '#24262B',
          muted: '#343840',
          border: '#2E3238',
        },
        primary: {
          DEFAULT: '#191A1E',
          foreground: '#FAF8F3',
        },
        secondary: {
          DEFAULT: '#474B53',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#EA580C',
          hover: '#C2410C',
          foreground: '#FFFFFF',
        },
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        background: '#FAF8F3',
        foreground: '#191A1E',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#191A1E',
          dark: '#191A1E',
        },
        muted: {
          DEFAULT: '#EDEAE1',
          foreground: '#646973',
        },
        border: '#E6E2D8',
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card-soft': '0 4px 20px -2px rgba(25, 26, 30, 0.05), 0 2px 6px -1px rgba(25, 26, 30, 0.03)',
        'card-hover': '0 12px 30px -4px rgba(25, 26, 30, 0.08), 0 4px 12px -2px rgba(25, 26, 30, 0.04)',
        'dark-bento': '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'pill': '0 2px 10px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
