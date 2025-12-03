export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t border-wip-border mt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span className="text-sm text-wip-muted">
              Build Better Daily
            </span>
          </div>
          <p className="text-wip-muted text-sm text-center">
            Clarity for construction leaders. One insight at a time.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://wip-insights.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-wip-muted hover:text-wip-gold transition-colors"
            >
              WIP Insights Tool
            </a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-wip-border/50 text-center">
          <p className="text-wip-muted/60 text-xs">
            © {currentYear} Build Better Daily. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

