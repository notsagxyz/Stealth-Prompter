/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./hud.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#090A0F',
          surface: '#0F121C',
          card: 'rgba(18, 20, 29, 0.70)',
          border: 'rgba(255, 255, 255, 0.10)',
        },
        cyber: {
          cyan: '#00F0FF',
          sky: '#38BDF8',
          glow: 'rgba(0, 240, 255, 0.25)',
        },
        stealth: {
          emerald: '#10B981',
          dim: 'rgba(16, 185, 129, 0.20)',
        }
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        cyber: '0 0 15px rgba(0, 240, 255, 0.3)',
        emerald: '0 0 15px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
