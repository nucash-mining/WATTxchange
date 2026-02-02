/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // WATTxchange brand colors
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          100: '#1a1a1a',
          200: '#252525',
          300: '#2f2f2f',
          400: '#3d3d3d',
        },
        accent: {
          yellow: '#EAB308',
          green: '#22c55e',
          pink: '#ec4899',
          red: '#dc2626',
          blue: '#3498db',
        }
      },
      fontFamily: {
        mono: ['SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
};
