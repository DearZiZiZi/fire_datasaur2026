/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D0D0D',
          secondary: '#161616',
          tertiary: '#1E1E1E',
        },
        brand: {
          green: '#22C55E',
          hover: '#16A34A',
          amber: '#E5A00D',
        },
        border: '#2A2A2A',
        accent: {
          blue: '#3B82F6',
          gold: '#E5A00D',
          red: '#EF4444',
          green: '#22C55E',
          orange: '#F59E0B',
        },
        text: {
          primary: '#E5E5E5',
          secondary: '#A3A3A3',
          muted: '#737373',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'bloom': '0 1px 0 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
};
