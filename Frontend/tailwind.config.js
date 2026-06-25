/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crimson:  { DEFAULT: '#C0162C', dark: '#8B0000', light: '#FFF5F5' },
        charcoal: { DEFAULT: '#1A1A2E', 700: '#2d2d4a' },
        gold:     { DEFAULT: '#FFD700', dark: '#B8960C' },
        blush:    '#FFF5F5',
        cream:    '#F8FAFC',
        success:  '#16A34A',
        warning:  '#D97706',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in-up':   'fadeInUp 0.4s ease-out',
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-right':  'slideInRight 0.4s ease-out',
        'gradient':     'gradientShift 6s ease infinite',
        'critical':     'criticalPulse 2s ease-in-out infinite',
        'bell':         'bellRing 0.8s ease-in-out',
        'shimmer':      'shimmer 1.5s infinite',
        'count-up':     'countUp 0.6s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeInUp:      { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:        { from: { opacity: 0 }, to: { opacity: 1 } },
        slideInRight:  { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        criticalPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(192,22,44,0.5)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(192,22,44,0)' },
        },
        bellRing: {
          '0%, 100%':   { transform: 'rotate(0deg)' },
          '10%, 30%, 50%': { transform: 'rotate(-15deg)' },
          '20%, 40%':   { transform: 'rotate(15deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countUp:  { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(40px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      backgroundSize: { '200': '200% 200%' },
      backdropBlur:   { xs: '2px' },
    },
  },
  plugins: [],
};
