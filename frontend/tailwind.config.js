/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FDFBF7',
          warm: '#F7F4EC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F9F8F5',
        },
        borderline: {
          DEFAULT: '#E5E2DA',
          subtle: '#EDEAE2',
          strong: '#D1CDC2',
        },
        sapphire: {
          DEFAULT: '#0F2942',
          light: '#1B3B5C',
          dark: '#081726',
        },
        champagne: {
          DEFAULT: '#C5A880',
          light: '#DFC7A7',
          dark: '#A6875E',
          soft: '#F5EFE6',
        },
        sage: {
          DEFAULT: '#2D5A27',
          light: '#3C7334',
          soft: '#EAF3E9',
        },
        bordeaux: {
          DEFAULT: '#6A1B29',
          light: '#8A2739',
          soft: '#FCEEF0',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['Cinzel', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        executive: '0 4px 20px -2px rgba(15, 41, 66, 0.05), 0 2px 6px -1px rgba(15, 41, 66, 0.03)',
        'executive-hover': '0 10px 30px -4px rgba(15, 41, 66, 0.08), 0 4px 12px -2px rgba(15, 41, 66, 0.04)',
      },
    },
  },
  plugins: [],
};
