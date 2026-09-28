/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Roboto Mono', 'Courier New', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
          500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16',
        },
        emerald2: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
          500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        cream: {
          50: '#fefcf9', 100: '#fdf8f0', 200: '#faf0e0', 300: '#f5e6cc',
        },
      },
      borderRadius: {
        'xl2': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(2,6,23,0.06)',
        'card-lg': '0 8px 32px rgba(2,6,23,0.08)',
        'glow': '0 0 24px rgba(34,197,94,0.15)',
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
