import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // WIP Insights inspired color palette
        'wip-dark': '#0a0f1a',
        'wip-navy': '#111827',
        'wip-card': '#1a2332',
        'wip-border': '#2a3544',
        'wip-gold': '#f59e0b',
        'wip-gold-dark': '#d97706',
        'wip-text': '#e5e7eb',
        'wip-muted': '#9ca3af',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

