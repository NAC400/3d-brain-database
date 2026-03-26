/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-brain': '#0f172a',
        'brain-primary': '#1e40af',
        'brain-secondary': '#3b82f6',
      }
    },
  },
  plugins: [],
} 