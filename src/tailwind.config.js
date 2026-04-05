/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          1: '#040810',
          2: '#060D14',
          3: '#0A1628',
          4: '#0D1F35',
          5: '#122640',
        },
        neon: {
          green:     '#00FF87',
          'green-d': '#00C875',
          cyan:      '#00D4FF',
          'cyan-d':  '#00A8CC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0,255,135,0.25)',
        'neon-cyan':  '0 0 20px rgba(0,212,255,0.25)',
        'neon-sm':    '0 0 10px rgba(0,255,135,0.15)',
      },
    },
  },
  plugins: [],
}
