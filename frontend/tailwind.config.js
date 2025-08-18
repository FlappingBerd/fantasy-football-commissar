/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      colors: {
        'terminal': {
          'bg': '#0d1117',
          'fg': '#c9d1d9',
          'accent': '#58a6ff',
          'border': '#30363d',
          'selection': '#264f78',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 