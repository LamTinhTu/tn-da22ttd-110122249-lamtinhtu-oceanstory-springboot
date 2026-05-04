/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pastel: {
          50: '#fff7fb',
          100: '#fce4ec',
          200: '#f8bbd0',
          300: '#f48fb1',
          400: '#ec6794'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(30, 27, 75, 0.08)'
      }
    }
  },
  plugins: []
};
