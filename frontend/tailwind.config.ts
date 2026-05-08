import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: { DEFAULT: '#0a0f1e', 50: '#0d1426', 100: '#111827', 200: '#1f2937', 300: '#374151', 400: '#4b5563' },
        accent: { DEFAULT: '#6366f1', hover: '#4f46e5', light: '#818cf8' },
        risk: { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', minimal: '#22c55e' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: { 'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite', 'fade-in': 'fadeIn 0.3s ease-in-out', 'slide-up': 'slideUp 0.3s ease-out' },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
