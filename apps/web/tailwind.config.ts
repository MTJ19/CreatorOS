import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  // Dark mode via class strategy — `dark` class on <html>
  darkMode: ['class'],

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // ─── Color Palette ─────────────────────────────────────
      colors: {
        // Backgrounds
        background: {
          DEFAULT: 'hsl(var(--background))',
          surface: 'hsl(var(--background-surface))',
          elevated: 'hsl(var(--background-elevated))',
          overlay: 'hsl(var(--background-overlay))',
        },

        // Foreground / text
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          muted: 'hsl(var(--foreground-muted))',
          subtle: 'hsl(var(--foreground-subtle))',
        },

        // Primary brand — electric indigo
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          muted: 'hsl(var(--primary-muted))',
          glow: 'hsl(var(--primary-glow))',
          '50': 'hsl(245 100% 97%)',
          '100': 'hsl(245 96% 93%)',
          '200': 'hsl(244 92% 87%)',
          '300': 'hsl(244 87% 78%)',
          '400': 'hsl(244 83% 69%)',
          '500': 'hsl(244 76% 60%)',
          '600': 'hsl(244 70% 52%)',
          '700': 'hsl(244 65% 43%)',
          '800': 'hsl(244 60% 35%)',
          '900': 'hsl(244 56% 28%)',
          '950': 'hsl(244 60% 16%)',
        },

        // Accent — electric violet
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          hover: 'hsl(var(--accent-hover))',
        },

        // Semantic
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          muted: 'hsl(var(--success-muted))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          muted: 'hsl(var(--warning-muted))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
          muted: 'hsl(var(--danger-muted))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          muted: 'hsl(var(--info-muted))',
        },

        // Deal status colors
        deal: {
          draft: 'hsl(var(--deal-draft))',
          negotiating: 'hsl(var(--deal-negotiating))',
          active: 'hsl(var(--deal-active))',
          completed: 'hsl(var(--deal-completed))',
          cancelled: 'hsl(var(--deal-cancelled))',
          disputed: 'hsl(var(--deal-disputed))',
        },

        // Risk severity colors
        risk: {
          low: 'hsl(var(--risk-low))',
          medium: 'hsl(var(--risk-medium))',
          high: 'hsl(var(--risk-high))',
          critical: 'hsl(var(--risk-critical))',
        },

        // UI chrome
        border: {
          DEFAULT: 'hsl(var(--border))',
          subtle: 'hsl(var(--border-subtle))',
          strong: 'hsl(var(--border-strong))',
        },

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },

      // ─── Border Radius ──────────────────────────────────────
      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '6px',
        DEFAULT: '10px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
        '3xl': '36px',
        full: '9999px',
      },

      // ─── Spacing extends ────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },

      // ─── Typography ─────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...fontFamily.mono],
        display: ['var(--font-inter)', ...fontFamily.sans],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },

      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      // ─── Shadows & Glows ────────────────────────────────────
      boxShadow: {
        'glow-sm': '0 0 10px 0 hsl(var(--primary-glow) / 0.3)',
        glow: '0 0 20px 0 hsl(var(--primary-glow) / 0.4)',
        'glow-lg': '0 0 40px 0 hsl(var(--primary-glow) / 0.5)',
        'glow-xl': '0 0 80px 0 hsl(var(--primary-glow) / 0.4)',
        'glow-success': '0 0 20px 0 hsl(var(--success) / 0.4)',
        'glow-danger': '0 0 20px 0 hsl(var(--danger) / 0.4)',
        'card-inset': 'inset 0 1px 0 0 hsl(var(--border) / 0.5)',
        float: '0 8px 32px 0 hsl(0 0% 0% / 0.4)',
        'float-lg': '0 24px 64px 0 hsl(0 0% 0% / 0.5)',
      },

      // ─── Animations ─────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(4px)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px 0 hsl(var(--primary-glow) / 0.3)' },
          '50%': { boxShadow: '0 0 40px 0 hsl(var(--primary-glow) / 0.6)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },

      // ─── Background ─────────────────────────────────────────
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient':
          'radial-gradient(at 40% 20%, hsl(244 76% 60% / 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsl(280 76% 60% / 0.10) 0px, transparent 50%), radial-gradient(at 0% 50%, hsl(200 76% 60% / 0.08) 0px, transparent 50%)',
        shimmer:
          'linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / 0.06) 50%, transparent 100%)',
      },

      // ─── Backdrop Blur ──────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },

  plugins: [],
};

export default config;
