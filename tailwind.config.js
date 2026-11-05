/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vitaria: {
          primary: '#84A282',
          'primary-dark': '#587A58',
          'primary-light': '#E6EEE3',
          'primary-soft': '#F0F5ED',
          background: '#F7F9F5',
          surface: '#FFFFFF',
          'text-primary': '#26382B',
          'text-secondary': '#778477',
          border: '#E7EBE4',
          disabled: '#B8C2B5',
          success: '#4E9B69',
          warning: '#D99B42',
          danger: '#D96A68',
          info: '#648BB7',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(38, 56, 43, 0.04)',
        'soft': '0 4px 16px -2px rgba(38, 56, 43, 0.06), 0 2px 4px -1px rgba(38, 56, 43, 0.03)',
        'soft-lg': '0 10px 25px -3px rgba(38, 56, 43, 0.08), 0 4px 6px -2px rgba(38, 56, 43, 0.04)',
        'glow': '0 0 25px -5px rgba(132, 162, 130, 0.35)',
      },
      borderRadius: {
        'card': '16px',
        'modal': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
