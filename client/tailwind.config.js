/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#0A0A0A',
        card: '#111111',
        cardBorder: '#1E1E1E',
        accent: '#FF2020',
        muted: '#999999',
      },
      boxShadow: {
        jelly: '0 0 120px rgba(255, 32, 32, 0.45)',
      },
    },
  },
  plugins: [],
};
