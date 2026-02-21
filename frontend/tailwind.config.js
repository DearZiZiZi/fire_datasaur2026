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
          primary: '#0B0E14',    // Deep Night
          secondary: '#151921',  // Card Surface
          tertiary: '#1C222D',   // Input/Header
        },
        brand: {
          green: '#00B25B',
          hover: '#008F49',
          amber: '#0bee0bff',
        },
        border: '#1F2937',
        accent: {
          blue: '#3B82F6',
          gold: '#F59E0B',
          red: '#EF4444',
          green: '#10B981',
          orange: '#F97316',
        },
        text: {
          primary: '#E2E8F0',    // Slate White
          secondary: '#94A3B8',  // Slate Gray
          muted: '#64748B',      // Dark Slate
        }
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'terminal-gradient': 'linear-gradient(180deg, rgba(21, 25, 33, 0.8) 0%, rgba(11, 14, 20, 0.9) 100%)',
      },
      boxShadow: {
        'terminal': '0 0 0 1px rgba(245, 158, 11, 0.1)',
        'terminal-focus': '0 0 0 2px rgba(245, 158, 11, 0.2)',
      }
    },
  },
  plugins: [],
}
