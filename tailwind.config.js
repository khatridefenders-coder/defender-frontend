/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eaf4fb',
          100: '#d5e9f7',
          500: '#1a5276',
          600: '#154360',
          700: '#0e2d42',
        },
        gold: '#f9e79f',
      },
    },
  },
  plugins: [],
};
