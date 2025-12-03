export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t border-wip-border mt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-wip-gold to-wip-gold-dark rounded flex items-center justify-center">
              <span className="text-wip-dark font-bold text-xs">W</span>
            </div>
            <span className="text-sm text-wip-muted">
              WIP Wisdom
            </span>
          </div>
          <p className="text-wip-muted text-sm text-center">
            Building better construction businesses, one insight at a time.
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
            © {currentYear} WIP Wisdom. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

