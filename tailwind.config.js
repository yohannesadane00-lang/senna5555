/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#e8f0eb',
          100: '#d1e1d7',
          200: '#a3c3af',
          300: '#75a587',
          400: '#47875f',
          500: '#184528',
          600: '#184528',
          700: '#184528',
          800: '#12331b',
          900: '#0c2212',
        },
      },
    },
  },
  plugins: [],
};

