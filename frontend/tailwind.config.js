/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brain-primary': '#1e40af',
        'brain-secondary': '#3b82f6',
        'neural-pink': '#ec4899',
        'neural-green': '#10b981',
        'neural-purple': '#8b5cf6',
        'dark-brain': '#0f172a',
        'light-brain': '#f8fafc',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
} 