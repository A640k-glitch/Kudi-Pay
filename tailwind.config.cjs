/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F172A',
          dark: '#020617',
        },
        accent: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        'neutral-base': '#F8FAFC',
        'neutral-text': '#0F172A',
        destructive: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      screens: {
        xs: '400px',
        '3xl': '1680px',
        '4xl': '2200px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'marquee-fast': 'marquee 15s linear infinite',
        'marquee-slow': 'marquee 100s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}
