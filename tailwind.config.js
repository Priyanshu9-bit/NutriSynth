/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Roboto Mono', 'monospace'],
      },
      colors: {
        // Deep Navy (#07111F) - Flagship main background & dark ambiance
        navy: {
          950: '#07111F', // Main background
          900: '#0A1526',
          850: '#0D1A2E',
          800: '#101D2D', // Elevated navy/graphite surface
          border: '#1E293B',
          subtle: '#162234',
        },
        // Graphite (#0B0F0E & #101D2D) - Premium dark surfaces and cards
        graphite: {
          950: '#0B0F0E', // Main surface / card
          base: '#0B0F0E',
          card: '#0B0F0E',
          elevated: '#101D2D', // Elevated surface / card
          surface: '#101D2D',
          border: '#1E293B',
          divider: 'rgba(255, 255, 255, 0.08)',
        },
        // Emerald (#22C55E) - Primary actions and health vitality
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#4ade80',
          500: '#22c55e', // Emerald primary
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Mint (#2DD4BF & #34D399) - Health indicators, energy, progress
        mint: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#34d399', // Mint secondary
          500: '#2dd4bf', // Mint primary
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Subtle Blue (#60A5FA) - Secondary information & tech accents
        techblue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa', // Subtle blue tech accent
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#082f49',
        },
        // NutriSynth curated typography tokens
        nutri: {
          bg: '#07111F',
          card: '#0B0F0E',
          elevated: '#101D2D',
          border: '#1E293B',
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#8492A6',
        },
        brand: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#34d399',
          500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16',
        },
        emerald2: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
          500: '#22c55e', 600: '#16a34a', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
      },
      borderRadius: {
        'xl2': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.25)',
        'card-lg': '0 12px 36px -4px rgba(7, 17, 31, 0.7), 0 4px 12px -2px rgba(0, 0, 0, 0.45)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.16)',
        'glow-emerald': '0 0 20px rgba(34, 197, 94, 0.18)',
        'glow-mint': '0 0 20px rgba(45, 212, 191, 0.18)',
        'glow-blue': '0 0 20px rgba(96, 165, 250, 0.15)',
        'navy-depth': '0 8px 32px rgba(7, 17, 31, 0.8)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
        },
        'bar-grow': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-scale': 'fade-in-scale 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'slide-in-left': 'slide-in-left 0.4s ease-out',
        'bar-grow': 'bar-grow 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
