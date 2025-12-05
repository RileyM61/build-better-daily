import { Construction, Sparkles } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-wip-border bg-wip-card/20 mt-24">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wip-card to-wip-dark border border-wip-border flex items-center justify-center text-wip-gold shadow-lg shadow-wip-gold/5">
              <Construction className="w-4 h-4" />
            </div>
            <span className="font-semibold text-wip-text tracking-tight">
              Build Better Daily
            </span>
          </div>

          <p className="text-wip-muted text-sm text-center md:text-left flex items-center gap-2">
            Clarity for construction leaders
            <span className="w-1 h-1 rounded-full bg-wip-border" />
            One insight at a time.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://wip-insights.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-wip-muted hover:text-white transition-colors flex items-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-wip-gold" />
              WIP Insights Tool
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-wip-border/50 text-center md:flex md:justify-between md:items-center">
          <p className="text-wip-muted/60 text-xs">
            © {currentYear} Build Better Daily. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0 text-xs text-wip-muted/60">
            <a href="#" className="hover:text-wip-muted transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-wip-muted transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

