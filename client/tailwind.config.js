/** @type {import('tailwindcss').Config} */
export default {
  content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}"
],
  theme: {
    extend: {
       fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'sans': ['Montserrat', 'ui-sans-serif', 'system-ui'],
        'poppins': ['Poppins', 'sans-serif'],

      },
      boxShadow: {
        glow: '0 0 12px 4px rgba(0, 0, 0, 0.10)',
        light: '0 0 6px 2px rgba(0, 0, 0, 0.05)',
      },

      colors: {
        'primary-red': '#AC0000',
        'hover-red': '#950000',
        'secondary-red': '#730C0C',
        'error-red': '#DC4E4E',
    },
  },
  plugins: [],
  }
};

