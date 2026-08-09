/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sidebar (dark) palette
        ink: {
          950: '#0a0f1c',
          900: '#0f1626',
          800: '#162038',
          700: '#1f2a44',
          600: '#2a375a',
        },
        // Main canvas (light) palette
        canvas: {
          50: '#f7f9fc',
          100: '#f1f4f9',
          200: '#e6ecf3',
        },
        brand: {
          50: '#eef4ff',
          100: '#dbe7ff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,22,38,0.04), 0 4px 16px -4px rgba(15,22,38,0.06)',
      },
    },
  },
  plugins: [],
};
