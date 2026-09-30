/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,jsx}'
  ],
  // purge: ['./src/**/*.vue'],
  purge: {
    enabled: true,
    content: ['./src/**/*.{html,js,vue}']
  },
  theme: {
    extend: {
      animation: {
        blink: 'blink 1.2s infinite steps(1, start)'
      },
      keyframes: {
        blink: {
          '0%, 100%': { 'background-color': 'currentColor' },
          '50%': { 'background-color': 'transparent' }
        }
      }
    }
  },
  plugins: []
}
