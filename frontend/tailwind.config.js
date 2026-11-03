/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#0f172a',    // Dark navy/slate
          navy: '#1e293b',    // Slate 800
          blue: '#1d4ed8',    // Primary blue
          accent: '#2563eb',  // Active accent
          critical: '#dc2626',// Critical Red
          warning: '#d97706', // Warning Amber
          success: '#16a34a', // Success Green
        }
      }
    },
  },
  plugins: [],
}
