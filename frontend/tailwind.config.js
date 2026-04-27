/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          brown: '#8B4513',
          orange: '#FF7F50', 
          yellow: '#FFD700',
          blue: '#1E90FF',
        }
      }
    },
  },
  plugins: [],
}