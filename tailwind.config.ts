import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'rgb(150 29 55)',
        ink: '#0a0a0a',
      },
      borderRadius: {
        panel: 'var(--rh-radius)',
      },
      boxShadow: {
        panel: 'var(--rh-shadow)',
      },
    },
  },
  plugins: [],
} satisfies Config

