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
      },
      boxShadow: {
        glow: '0 0 12px 4px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}

