/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0a0f1a',
        },
        amber: {
          350: '#fcd37a',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-up':     'fadeUp 0.4s ease forwards',
        'pulse-amber': 'pulse-amber 2s infinite',
      },
    },
  },
  plugins: [],
};
