/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: withOpacity('--color-void'),
        deep: withOpacity('--color-deep'),
        surface: withOpacity('--color-surface'),
        elevated: withOpacity('--color-elevated'),
        'accent-electric': withOpacity('--color-accent-electric'),
        'accent-cyan': withOpacity('--color-accent-cyan'),
        'accent-violet': withOpacity('--color-accent-violet'),
        'accent-emerald': withOpacity('--color-accent-emerald'),
        'accent-rose': withOpacity('--color-accent-rose'),
        'accent-amber': withOpacity('--color-accent-amber'),
        'text-primary': withOpacity('--color-text-primary'),
        'text-secondary': withOpacity('--color-text-secondary'),
        'text-muted': withOpacity('--color-text-muted'),
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        'gradient-cyan': 'linear-gradient(135deg, #06B6D4, #6366F1)',
        'gradient-success': 'linear-gradient(135deg, #10B981, #06B6D4)',
        'gradient-danger': 'linear-gradient(135deg, #F43F5E, #F59E0B)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-electric': '0 0 20px rgba(99,102,241,0.4)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.4)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.4)',
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
        marquee: 'marquee 30s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
