import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-wip-border bg-wip-dark/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            {/* Book Icon */}
            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" style={{display: 'none'}}/>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-gray-400 group-hover:text-gray-300 transition-colors">Build</span>
              <span className="text-lg font-bold text-wip-gold group-hover:text-wip-gold-dark transition-colors -mt-1">Better</span>
              <span className="text-lg font-bold text-gray-400 group-hover:text-gray-300 transition-colors -mt-1">Daily</span>
            </div>
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

