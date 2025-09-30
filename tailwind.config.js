/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark Pro Theme Colors
        'dark-bg-primary': '#0f172a',
        'dark-bg-secondary': '#1e293b',
        'dark-bg-tertiary': '#334155',
        'dark-text-primary': '#f8fafc',
        'dark-text-secondary': '#cbd5e1',
        'dark-text-muted': '#9ca3af',
        'dark-border': '#475569',
        warning: '#fbbf24',
        danger: '#ef4444',
        success: '#10b981',
        info: '#3b82f6',
        gray: {
          950: '#0f172a', // Background principal
          900: '#111827', // Contenedores
          800: '#1f2937', // Bordes y elementos secundarios
          700: '#374151', // Elementos interactivos
          600: '#4b5563', // Texto secundario
          500: '#6b7280', // Texto terciario
          400: '#9ca3af', // Texto deshabilitado
          300: '#d1d5db', // Texto claro
          100: '#f3f4f6', // Texto off-white
        },
        // Vibrant Course Colors
        course: {
          blue: '#3B82F6',
          emerald: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          violet: '#8B5CF6',
          pink: '#EC4899',
          cyan: '#06B6D4',
          lime: '#84CC16',
          orange: '#F97316',
          indigo: '#6366F1',
        },
        // Neon palette for dynamic gradients
        neon: {
          lime: '#B8FF2C',
          green: '#39FF14',
          cyan: '#00E5FF',
          blue: '#00A3FF',
          purple: '#B367FF',
          pink: '#FF4D9D',
          red: '#FF3B3B',
          orange: '#FF8A00',
          yellow: '#F9F871',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        hard: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'hard-lg':
          '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        card: '0 8px 25px -5px rgba(0, 0, 0, 0.4), 0 4px 10px -2px rgba(0, 0, 0, 0.3)',
        modal:
          '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        glow: '0 0 30px rgba(184,255,44,0.08), 0 0 60px rgba(0,229,255,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradientX 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      borderRadius: {
        sm: '0.125rem', // 2px - minimal rounded
        md: '0.375rem', // 6px - slightly rounded
        lg: '0.5rem', // 8px - rounded
      },
      spacing: {
        18: '4.5rem', // 72px
        88: '22rem', // 352px
        128: '32rem', // 512px
      },
      maxWidth: {
        '8xl': '88rem', // 1408px
        '9xl': '96rem', // 1536px
      },
      minHeight: {
        'screen-75': '75vh',
        'screen-85': '85vh',
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    },
  },
  plugins: [
    // Plugin personalizado para componentes
    function ({ addComponents, theme }) {
      addComponents({
        '.btn-primary': {
          backgroundColor: theme('colors.blue.600'),
          color: theme('colors.white'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.blue.700'),
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.gray.700'),
          color: theme('colors.white'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.gray.600'),
          },
        },
        '.btn-danger': {
          backgroundColor: theme('colors.red.600'),
          color: theme('colors.white'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.red.700'),
          },
        },
        '.input-field': {
          width: '100%',
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          backgroundColor: theme('colors.gray.800'),
          border: `1px solid ${theme('colors.gray.600')}`,
          borderRadius: theme('borderRadius.md'),
          color: theme('colors.white'),
          transition: 'all 0.15s ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.blue.500'),
            boxShadow: `0 0 0 3px ${theme('colors.blue.500')}20`,
          },
        },
        '.card': {
          backgroundColor: theme('colors.gray.900'),
          border: `1px solid ${theme('colors.gray.800')}`,
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.hard'),
        },
        '.sidebar-item': {
          display: 'flex',
          alignItems: 'center',
          gap: theme('spacing.3'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          color: theme('colors.gray.300'),
          borderRadius: theme('borderRadius.md'),
          transition: 'all 0.15s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            color: theme('colors.white'),
            backgroundColor: theme('colors.gray.800'),
          },
          '&.active': {
            color: theme('colors.white'),
            backgroundColor: theme('colors.blue.600'),
            '&:hover': {
              backgroundColor: theme('colors.blue.700'),
            },
          },
        },
      });
    },
  ],
};
