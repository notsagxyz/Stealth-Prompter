/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./hud.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        canvas: {
          DEFAULT: '#0A0B0E',
          subtle: '#12141A',
        },
        glass: {
          surface: 'rgba(18, 20, 26, 0.78)',
          overlay: 'rgba(24, 27, 36, 0.65)',
          card: 'rgba(255, 255, 255, 0.04)',
          hover: 'rgba(255, 255, 255, 0.07)',
          active: 'rgba(255, 255, 255, 0.10)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-strong': 'rgba(255, 255, 255, 0.15)',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          subtle: 'rgba(255, 255, 255, 0.08)',
          hover: '#E2E8F0',
        },
        status: {
          ready: '#22C55E',
          dim: 'rgba(34, 197, 94, 0.15)',
        }
      },
      backdropBlur: {
        hud: '28px',
        glass: '20px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        hud: '0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        inset: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      }
    },
  },
  plugins: [],
}
