/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'from-indigo-950',
    'via-purple-900',
    'to-slate-900',
    'from-emerald-950',
    'via-teal-950',
    'to-zinc-950',
    'from-cyan-950',
    'via-blue-950',
    'to-neutral-950',
    'from-yellow-950',
    'via-amber-900',
    'to-neutral-950',
    'from-amber-950',
    'via-stone-900',
    'from-amber-950',
    'to-black',
    'from-sky-950',
    'via-cyan-900',
    'to-slate-950',
    'bg-gradient-to-br',
    'bg-gradient-to-tr',
    'bg-gradient-to-r'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#12100E',
          deep: '#0B0A08',
          light: '#181512',
        },
        leather: {
          DEFAULT: '#1E1916',
          dark: '#171311',
          light: '#28221D',
          border: 'rgba(212, 175, 55, 0.2)',
        },
        parchment: {
          DEFAULT: '#F4E8C1',
          light: '#FAF3DC',
          dark: '#E2D2A4',
          muted: '#A89F91',
        },
        gold: {
          alchemy: '#D4AF37',
          light: '#F3D87E',
          dark: '#9E7D17',
          glow: 'rgba(212, 175, 55, 0.35)',
        },
        potion: {
          emerald: '#10B981',
          emeraldDark: '#065F46',
          purple: '#8B5CF6',
          purpleDark: '#5B21B6',
          amber: '#F59E0B',
          amberDark: '#92400E',
          crimson: '#EF4444',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        cinzel: ['"Cinzel"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'alchemy': '0 0 25px rgba(212, 175, 55, 0.15)',
        'alchemy-glow': '0 0 35px rgba(212, 175, 55, 0.3)',
        'emerald-glow': '0 0 25px rgba(16, 185, 129, 0.3)',
        'purple-glow': '0 0 25px rgba(139, 92, 246, 0.3)',
        'potion-bubble': 'inset 0 0 15px rgba(255, 255, 255, 0.2)',
      },
      animation: {
        'float': 'float 5s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 20s linear infinite',
        'spin-reverse': 'spin-reverse 25s linear infinite',
        'bubble': 'bubble 3s ease-in-out infinite',
        'cauldron-boil': 'cauldronBoil 2s ease-in-out infinite alternate',
        'fadeIn': 'fadeIn 0.25s ease-out forwards',
        'slideUp': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scrollUnfurl': 'scrollUnfurl 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-40px) scale(1.2)', opacity: '0' },
        },
        cauldronBoil: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.02)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scrollUnfurl: {
          '0%': { opacity: '0', transform: 'translateY(20px) scaleY(0.7)' },
          '100%': { opacity: '1', transform: 'translateY(0) scaleY(1)' },
        }
      }
    },
  },
  plugins: [],
}
