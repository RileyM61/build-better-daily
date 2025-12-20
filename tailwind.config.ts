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
        // LOAD-BEARING AESTHETIC: Structural clarity for difficult content
        // Visual weight supports engagement with hard truths
        'wip-dark': '#e8e2d9',        // Main background - stable ground
        'wip-navy': '#d9d2c6',        // Secondary - darker for contrast
        'wip-card': '#f7f5f1',        // Cards - lifted off background
        'wip-border': '#b8ad9a',      // Borders - visible, structural
        'wip-heading': '#262320',     // Headings - charcoal authority
        'wip-gold': '#a6863f',        // Gold - muted gravitas
        'wip-gold-dark': '#8a6f32',   // Darker gold - firm hover
        'wip-text': '#363330',        // Text - warm dark gray
        'wip-muted': '#6b655a',       // Muted - clearly secondary
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

