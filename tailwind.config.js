/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{ts,tsx,html}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS custom properties
        // These adapt based on data-theme attribute (modern, zen, cyber)
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',
          secondary: 'var(--bg-surface-secondary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-primary-hover)',
          active: 'var(--accent-primary-active)',
          secondary: 'var(--accent-secondary)',
        },
        border: {
          DEFAULT: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          light: 'var(--border-light)',
        },
        // Status colors (theme-aware)
        success: {
          DEFAULT: 'var(--color-success)',
          50: '#f0fdf4',
          500: 'var(--color-success)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          50: '#fffbeb',
          500: 'var(--color-warning)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          50: '#fef2f2',
          500: 'var(--color-error)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          50: '#eff6ff',
          500: 'var(--color-info)',
        },
        // Legacy neutral colors (for backward compatibility)
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Legacy primary colors (backward compatibility - maps to accent)
        primary: {
          DEFAULT: 'var(--accent-primary)',
          500: 'var(--accent-primary)',
          600: 'var(--accent-primary-hover)',
        },
      },
      fontFamily: {
        sans: 'var(--font-body)',
        serif: 'var(--font-heading)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        accent: 'var(--shadow-accent)',
        glow: 'var(--shadow-glow)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
