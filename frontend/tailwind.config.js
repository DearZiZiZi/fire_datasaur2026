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
          primary: '#F8F9FA',
          secondary: '#FFFFFF',
          tertiary: '#F3F4F6',
        },
        brand: {
          green: '#00B25B',
          hover: '#008F49',
          amber: '#F59E0B',
        },
        border: '#E5E7EB',
        accent: {
          blue: '#3B82F6',
          gold: '#F59E0B',
          red: '#EF4444',
          green: '#10B981',
          orange: '#F97316',
        },
        text: {
          primary: '#1F2937',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
