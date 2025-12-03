import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-wip-border bg-wip-dark/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-wip-gold to-wip-gold-dark rounded-lg flex items-center justify-center">
              <span className="text-wip-dark font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-semibold text-white group-hover:text-wip-gold transition-colors">
              WIP Wisdom
            </span>
          </Link>
          <a
            href="https://wip-insights.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-wip-muted hover:text-wip-gold transition-colors flex items-center gap-1"
          >
            Try WIP Insights
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  )
}

